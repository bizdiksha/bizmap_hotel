frappe.ui.form.on('Sales Order', {
    refresh:function(frm){
      
   frm.add_custom_button(__('Frondesk'), function(){
        //frappe.set_route(["query-report", "Gross Profit"]);
    })
     if(frm.doc.docstatus==1){
       frm.add_custom_button(__('Room Folio'), function() {
           //frappe.set_route(['doctype', 'Room Folio HMS',], { reservation:frm.doc.name })
            //frappe.route_options = {"reservation":frm.doc.name}
            if(frm.doc.number_of_room <=1){
            var check_room_folio=frappe.db.get_value("Room Folio HMS",{'reservation':frm.doc.name},'name',(r) => {
             if(r.name!=null){
             
             frappe.set_route("Form", "Room Folio HMS",r.name)
             }
             else{
                
	       frappe.model.open_mapped_doc({
	          method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.doc_mapped_to_room_folia',
	          frm:cur_frm
	          });
	   
             
             }
            })
          }
          if(frm.doc.number_of_room >1){
           
             frappe.call({
              method :'bizmap_hotel.bizmap_hotel.doctype.sales_order.doc_mapped_to_for_multiple_room_folio',
              args: {
               'doc':frm.doc
             },
             callback: function(r) {
             
             }
             })
           frappe.route_options = {"reservation":frm.doc.name}
           frappe.set_route("Form", "Room Folio HMS")
           
          }
	});
    }

     },
     no_of_nights_cf(frm){
               frappe.call({
        method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.check_out_date',
        args: {
        'doc':frm.doc
             },
         callback: function(r) {
              frm.set_value("check_out_cf",r.message)
            
         }    
                     
         });

     },
     room_package_cf(frm){
     
    let value = frappe.db.get_value('Item Price',{'item_name' :frm.doc.room_package_cf}, 'price_list_rate',(r) =>{
      frm.set_value('room_rate_cf',r.price_list_rate)
    
    })
     
     },
     
     number_of_room(frm){
          if(frm.doc.no_of_nights_cf==null){
              frm.set_value('number_of_room',"")
             frappe.throw("Enter Number of Night First")
             
          }
          else{
             frappe.call({
        method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.insert_items',
        args: {
        'doc':frm.doc
             },
         callback: function(r) {
               console.log(r)
              
              cur_frm.get_field("items").grid.grid_rows[0].remove();
              cur_frm.refresh();
              var childTable = cur_frm.add_child("items")
              childTable.item_code=r.message[0];
              childTable.qty=r.message[1];
              childTable.reservation_date_from=r.message[2]
              childTable.reservation_date_to=r.message[3]
              childTable.item_name=r.message[0]
              childTable.rate=frm.doc.room_rate_cf
              childTable.description=r.message[4][0]
              childTable.uom=r.message[4][1]
              //cur_frm.refresh_fields("invoice_schedule")
              
              
              
         }    
                     
         });
       }  
     },
     weekend_rate_cf(frm){
      if(frm.doc.weekend_rate_cf!=null){
          
          
          if(frm.doc.no_of_nights_cf==null){
              frm.set_value('number_of_room',"")
             frappe.throw("Enter Number of Night First")
             
          }
          else{
             frappe.call({
        method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.insert_items',
        args: {
        'doc':frm.doc
             },
         callback: function(r) {
               console.log(r)
              
              cur_frm.get_field("items").grid.grid_rows[0].remove();
              cur_frm.refresh();
              var childTable = cur_frm.add_child("items")
              childTable.item_code=r.message[0];
              childTable.qty=r.message[1];
              childTable.reservation_date_from=r.message[2]
              childTable.reservation_date_to=r.message[3]
              childTable.item_name=r.message[0]
              childTable.rate=frm.doc.weekend_rate_cf
              childTable.description=r.message[4][0]
              childTable.uom=r.message[4][1]
              //cur_frm.refresh_fields("invoice_schedule")
              frm.set_value("room_rate_cf",frm.doc.weekend_rate_cf)
              frm.set_df_property("room_rate_cf","hidden",1)
              
              
         }    
                     
         });
       }  
     }
    },
     room_rate_cf(frm){
          
          if(frm.doc.no_of_nights_cf==null){
              frm.set_value('number_of_room',"")
             frappe.throw("Enter Number of Night First")
             
          }
          else{
             frappe.call({
        method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.insert_items',
        args: {
        'doc':frm.doc
             },
         callback: function(r) {
               console.log(r)
              
              cur_frm.get_field("items").grid.grid_rows[0].remove();
              cur_frm.refresh();
              var childTable = cur_frm.add_child("items")
              childTable.item_code=r.message[0];
              childTable.qty=r.message[1];
              childTable.reservation_date_from=r.message[2]
              childTable.reservation_date_to=r.message[3]
              childTable.item_name=r.message[0]
              childTable.rate=frm.doc.room_rate_cf
              childTable.description=r.message[4][0]
              childTable.uom=r.message[4][1]
              //cur_frm.refresh_fields("invoice_schedule")
              //frm.set_value("room_rate_cf",frm.doc.weekend_rate_cf)
              //frm.set_df_property("room_rate_cf","hidden",1)
              
              
         }    
                     
         });
       }  
     
    },
    onload:function(frm){
          if(frm.doc.contact_email && frm.doc.check_in_cf==null)
       {
         
         var fill_so_form=frappe.db.get_value("Sales Order",{'contact_email':frm.doc.contact_email},'*',(r) => {
           console.log(r.customer)
           frm.set_value("customer",r.customer)
           frm.set_value("guest_cf",r.guest_cf)
           frm.set_value("booking_type",r.booking_type)
           frm.set_value("check_in_cf",r.check_in_cf)
           frm.set_value("no_of_nights_cf",r.no_of_nights_cf)
           frm.set_value("check_out_cf",r.check_out_cf)
           frm.set_value("no_of_guest_cf",r.no_of_guest_cf)
           frm.set_value("reservation_notes_cf",r.reservation_notes_cf)
           frm.set_value("room_type_cf",r.room_type_cf)
           frm.set_value("room_package_cf",r.room_package_cf)
           // frm.set_value("number_of_room",r.number_of_room)
           frm.set_value("room_rate_cf",r.room_rate_cf)
           frm.set_value("weekend_rate_cf",r.weekend_rate_cf)
           
         })
       }
    },
     guest_cf:function(frm){
      frappe.call({
        method: 'bizmap_hotel.bizmap_hotel.doctype.sales_order.get_name_mobile_emalil_frm_contact',
        args: {
        'doc':frm.doc
             },
         callback: function(r){
                if(r.message){
                frm.set_value("contact_email",r.message.email_id)
                frm.set_value("contact_mobile",r.message.phone)
                frm.set_value("contact_display",r.message.full_name)
                frm.set_value("contact_person",r.message.name)
                
              }
            }
         })
     }
  }) 
