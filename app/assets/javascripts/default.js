$(function(){
  $('#banner-fade').bjqs({
    height      : 359,
    width       : 960,
    responsive  : true,
    showcontrols: false
  });

  $.each($(".leftcol .profile_menu .first_level li"), function(){
    if ($("ul.sub li", this).hasClass("selected"))
        $(this).addClass("selected");
    else
        $(this).find("ul.sub").hide();
  });

  $('*[data-auto-controller]').each(function() {
    var plg;
    var result;
    controllers = $(this).data('auto-controller').split(" ");
    for (i = 0; i < controllers.length; ++i) {
      if ((plg = $(this)['attach' + controllers[i]])) {
        result = plg.call($(this));
      }
    }
    return result;
  });
});

function menu_item_toggle(obj){
  list = obj.next('ul.sub');

  if(list.is(':visible')){
      list.slideUp('200');
  } else {
      list.slideDown('200');
  }
}

function check_str_length(str){
  var strength = 0

  if (str.length > 7) strength += 1;
  if (str.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/))  strength += 1;
  if (str.match(/([a-zA-Z])/) && str.match(/([0-9])/))  strength += 1;
  if (str.match(/([!,%,&,@,#,$,^,*,?,_,~])/))  strength += 1;
  if (str.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1;

  if (strength < 2 ) {
      $('.scale span').removeAttr('class');
      $('.scale span').addClass('filling grey');
      $('.scale span').width('50%');
  } else if (strength == 2 ) {
      $('.scale span').removeAttr('class');
      $('.scale span').addClass('filling yellow');
      $('.scale span').width('75%');
  } else {
      $('.scale span').removeAttr('class');
      $('.scale span').addClass('filling green');
      $('.scale span').width('100%');
  }

  if (str.length < 6) {
      $('.scale span').removeAttr('class');
      $('.scale span').width('25%');
      $('.scale span').addClass('filling red');
  }
}
;
