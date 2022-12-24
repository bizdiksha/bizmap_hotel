import frappe
import requests
import json
from datetime import date, datetime, timedelta
import requests
from requests.structures import CaseInsensitiveDict
import re


@frappe.whitelist(allow_guest=True)
def insertbooking():

    company = frappe.defaults.get_user_default("Company")
    abbr = frappe.db.sql(
        "select abbr from `tabCompany` where company_name = %s", company)
    # frappe.msgprint(abbr)

    url = "https://live.ipms247.com/pmsinterface/pms_connectivity.php"

    headers = CaseInsensitiveDict()
    headers["Accept"] = "application/json"
    headers["Content-Type"] = "application/json"

    data = {
        "RES_Request": {
                "Request_Type": "Bookings",
                "Authentication": {
                        "HotelCode": "35347",
                        "AuthCode": "7637120501df617d17-282d-11ed-8"
                    }
            }
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if (response.status_code == 200):
        tr = response.json()
        # j = json.loads(json.dumps(tr))
        if 'Reservations' in tr and isinstance(tr['Reservations'], dict):
            print('****************tr["Reservations"]****************', tr["Reservations"])
            unique_id_list = [{'unique_id': i['UniqueID']}
                for i in tr['Reservations']['Reservation']]
            for i in tr['Reservations']['Reservation']:
                unique_id_count_list = []
                for u in unique_id_list:
                    unique_id_count_dict, count = {}, 0
                    result = [r['SubBookingId'] for r in i['BookingTran']
                        if r['SubBookingId'].startswith(u['unique_id'])]
                    if len(result) > 0:
                        room_count = len(result)

                Uniq = i['UniqueID']
                num = "2"

                for r in i['BookingTran']:
                    if r['SubBookingId'] == Uniq+"-"+num:
                        break

                    tax_div = float(r['TotalTax'])/2
                    #Tax Variable
                    t_name = []
                    t_amount = []
                    CGST = "CGST"
                    count = 0


                    for t in r['RentalInfo']:

                        adult = t['Adult']
                        child = t['Child']
                        sum = int(adult) + int(child)

                        tax = f'{abbr[0]}'
                        tax_name = re.sub("[('',)]", "", tax)

                        stagging = frappe.new_doc("Sales Order")
                        stagging.guest = r['FirstName']
                        stagging.transactionid = r['TransactionId']
                        stagging.createdatetime = r['Createdatetime']
                        stagging.status = r['Status']
                        stagging.isconfirmed = r['IsConfirmed']
                        stagging.packagename = r['PackageName']
                        stagging.check_in = r['Start']
                        stagging.check_out = r['End']
                        stagging.total_amount = r['TotalAmountAfterTax'],
                        stagging.gender = r['Gender'],
                        stagging.mobile = r['Mobile'],
                    # Create customer
                    customer_list = frappe.get_list('Customer', fields=['customer_name'])
                    check = {'customer_name': stagging.guest}
                    if check not in customer_list:
                        customer = frappe.get_doc({
                            "doctype": "Customer",
                            "customer_name": stagging.guest,
                            "customer_group": 'Individual',
                            "territory":'India'
                        })
                        customer.insert()

                    # Create contact
                    contact_list = frappe.get_list('Contact', fields=['first_name'])
                    check = {'first_name': stagging.guest}
                    if check not in contact_list:
                        guest = frappe.get_doc({
                            "doctype": "Contact",
                            "first_name": stagging.guest,
                            # "last_name": stagging.guest,
                            "gender":r['Gender']

                        })

                        # Mail
                        guest.append("email_ids",{
                                                'email_id':r['Email'],
                                                'is_primary':1,


                                    })

                        # Mobile Number
                        guest.append("phone_nos",{
                                                'phone':r['Mobile'],
                                                'is_primary_mobile_no':1,


                                    })
                        # Customer
                        guest.append("links",{
                                                'link_doctype':'Customer',
                                                'link_name':stagging.guest,
                                                'link_title':stagging.guest,

                                    })

                        guest.insert()

                    # Create Sales Order
                    #  Two Date Diff
                    start = date.fromisoformat(r['Start'])
                    end = date.fromisoformat(r['End'])
                    diff = end - start

                    # Total Qty
                    qty = diff.days * room_count




                    # Transaction Id Check
                    sales_order = frappe.get_list('Sales Order', fields=['transactionid'])
                    check = {'transactionid': stagging.transactionid}

                    if check not in sales_order:
                        sales_order_api = frappe.get_doc({
                            "doctype": "Sales Order",
                            "company": company,
                            "customer": r['FirstName'],
                            "guest_cf":r['FirstName']+"-"+r['FirstName'],
                            "booking_type": "Online Booking",
                            "transactionid": r['TransactionId'],
                            "check_in_cf": r['Start'],
                            "no_of_nights_cf": diff.days,
                            "check_out_cf": r['End'],
                            "no_of_guest_cf": sum,
                            "room_type_cf":r['RoomTypeCode'],
                            "room_package_cf":r['RoomTypeName'],
                            "number_of_room": room_count,
                            "room_rate_cf": r['TotalAmountBeforeTax'],
                            # "taxes_and_charges":"Output GST In-state - B"


                    })
                        sales_order_api.append("items",{
                                                'item_code':r['RoomTypeName'],
                                                'item_name':r['RoomTypeName'],
                                                'qty':qty,
                                                "reservation_date_from": r['Start'],
                                                "reservation_date_to": r['End'],

                                            })
                        for t in r['TaxDeatil']:
                            tax_name1 = t['TaxName']
                            tax_amount1 = t['TaxAmount']
                            if t['TaxName'] == "CGST":
                                count += 1

                            #Tax Amount
                            if tax_amount1 not in t_amount:
                                t_amount.append(tax_amount1)

                            #Tax Name
                            if tax_name1 not in t_name:
                                t_name.append(tax_name1)


                        for tax_name1 in t_name:

                            sales_order_api.append("taxes",{
                                                'charge_type':"Actual",
                                                'account_head':tax_name1+" "+"- "+tax_name,
                                                'rate':"0.00",
                                                'tax_amount':tax_div,
                                                # "total": r['TotalAmountAfterTax'],
                                                'description':tax_name1+" "+"- "+tax_name,

                                            })

                        sales_order_api.insert()
                        sales_order_api.save()
                        # frappe.msgprint("Data Inserted Successfully")

        else:
            frappe.msgprint("No Reservation Found")

    else:
        frappe.msgprint("Auth Wrong")



