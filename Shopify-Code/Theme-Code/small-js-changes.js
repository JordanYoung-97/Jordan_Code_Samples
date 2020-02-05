// Random Testimonial on DOM Load
  var testimonials = document.getElementsByClassName('testimonial-container');
  var max = testimonials.length;
  var min = 0;
  
  var random = Math.floor(Math.random() * max) + 0 
  
  
  for (i = 0; i < testimonials.length; i++) {
    if(i == random){
    	testimonials[i].style.display = 'flex';
    }else{
      testimonials[i].style.display = 'none';
    }
  }
    
//Popup js to allow for such as upselling & email campaign
  if(customer){
  }else{
   	//wait 5 seconds then trigger addClass
    if(sessionStorage.getItem('popState') != 'shown')
    {
  		setTimeout(function() {  
        	$(".pu-e-container").addClass('popup-toggle');
   		 	}, 10000);
      	setTimeout(function() {  
        	$(".pu-e-container").addClass('fade-in');
   		 	}, 10010);
      
    	if(sessionStorage.getItem('subState') == 'submitted'){
      		console.log('hit');  
        	$(".pu-e-container").addClass('popup-toggle-fast');
    	}
    }
  }
    
    $(".contact-form").submit(function( event ) {
      sessionStorage.setItem('subState','submitted');
    });
    
    $(".pu-e-container").click (function(){
      $(".pu-e-container").removeClass('popup-toggle');
      $(".pu-e-container").removeClass('popup-toggle-fast');
      sessionStorage.setItem('popState','shown');
    });
    $(".pu-e-x").click (function(){
      $(".pu-e-container").removeClass('popup-toggle');
      $(".pu-e-container").removeClass('popup-toggle-fast');
      sessionStorage.setItem('popState','shown');
    });
    
    {% if form.posted_successfully? %}
    	sessionStorage.setItem('popState','shown');
    {% endif %}
    
    $(".pu-e").click(function(e){
  		e.stopPropagation();
	});
