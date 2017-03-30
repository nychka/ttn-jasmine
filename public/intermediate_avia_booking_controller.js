$.Controller('IntermediateAviaBookingController',"BookingController",{

  PREBOOKING_PAGE_INTERACTION: 1,
  BOOKING_PAGE_INTERACTION: 2,
  PAYMENT_CARD_INTERACTION: 3,

  INTERACTION_LIMIT: 4,

  form_btn_ready: true,
  tr_error_reason: false,

  init: function(){
    this.filed_chars = {}
    this.filed_chars[ this.parent.PREBOOKING_PAGE_INTERACTION ] = 0
    this.filed_chars[ this.parent.BOOKING_PAGE_INTERACTION ] = 0
    this.filed_chars[ this.parent.PAYMENT_CARD_INTERACTION ] = 0
  },
  // EVENTS START
  "input -> keyup":function(e){
    e.preventDefault();
    var self = this;

    if(e.which === 13) {
      var el = this.element.find(e.target);
      if(!el.hasClass('js-ignore-valid-next-unfilled') && el.valid() && !el.hasClass('js-ignore-next-unfilled')){
        var n_el = this.scroll_to('next_unfilled', 500);
        if(n_el.length == 0 && $('#login_form:visible').length == 0) this.element.find('form .js-form-btn').click();
      }
    }
    this.check_interaction( $(e.target) )
  },
  "input -> keydown":function(e){
    var self = this;
    // if(!window.is_mobile && e.which === 9){
    //   var el = this.element.find(e.target);
    //   if(!el.hasClass('js-ignore-next-unfilled')){
    //     var n_el = this.scroll_to('next_unfilled', 500, false, false);
    //     if(n_el.length > 0){
    //       e.preventDefault();
    //       n_el.focus();
    //     }
    //   }
    // }
    if(window.is_mobile && e.which === 9){
      e.preventDefault();
      var el = this.element.find(e.target);
      if(!el.hasClass('js-ignore-valid-next-unfilled') && el.valid() && !el.hasClass('js-ignore-next-unfilled')){
        var n_el = this.scroll_to('next_unfilled', 500);
        if(n_el.length == 0 && $('#login_form:visible').length == 0) this.element.find('form .js-form-btn').click();
      }
    }
  },
  ".hidden_nationality -> change":function(ev){
    this.set_docnum_validation_for_ru(ev.target);
  },
  ".js-expiration-checker -> change":function(el){
    var el = $(el.target);
    var input = this.element.find('#js-doc-expire_'+el.data('key')+' input');
    input.removeClass("error")
    input.siblings('.error').remove();
    if(el.is(":checked")){
      input.removeAttr('disabled');
      input.attr('required','required')
      input.addClass('mobile_date_valid');
      el.val('true');
      input.eq(0).focus();
    }else{
      input.attr('disabled','disabled');
      input.removeAttr('required');
      input.removeClass('mobile_date_valid');
      el.val('false');
      input.eq(0).blur();
    }
  },
    //PAGE LOGIN FORM ERRORS
  "input[type=email], #login_form #pass -> focus":function(ev){
    var idx = this.element.find(".js-user-field-form input").index($(ev.target));
    window.hide_error_popup(idx)
  },

  ".js-booking-login-form-btn -> click":function(ev){
    //this.element.find(".js-user-field-form samp.error").remove();
  },
  // EVENTS END

  // FUNCTIONS START
  set_docnum_validation_as_to_nationality:function(data){
    var self = this;
    self.element.find(".hidden_nationality").each(function(){
      self.set_docnum_validation_for_ru(this);
    });
  },
  set_docnum_validation_for_ru:function(nationality_el){
    nat_hidden = $(nationality_el);
    doc_element = nat_hidden.parent().siblings('.document_number').find(':input');
    if(doc_element){
        if(nat_hidden.val() == 'RU' && !doc_element.hasClass('ru_international_check')){
          if(doc_element.hasClass('valid_docnum')){
            if(doc_element.hasClass('sirena_doc_check')){
              doc_element.removeClass('valid_docnum');
              doc_element.removeClass('only_alphanum_latin');
              doc_element.addClass('valid_docnum_for_sirena');
            }else if(ut_passport_validating){
              doc_element.removeClass('valid_docnum');
              doc_element.addClass('valid_docnum_for_ru');
            }
          }
        }else{
          if(doc_element.hasClass('valid_docnum_for_ru')){
            doc_element.removeClass('valid_docnum_for_ru');
            doc_element.addClass('valid_docnum');
          }
          if(doc_element.hasClass('valid_docnum_for_sirena')){
            doc_element.removeClass('valid_docnum_for_sirena');
            doc_element.addClass('valid_docnum');
            doc_element.addClass('only_alphanum_latin');
          }
        }
      }
  },
  login_submit:function(){
    if(!this.element.find("#email").valid() || !this.element.find("#pass").valid()){ return false;}
    var email = this.element.find("#email").val(),
     pass  = this.element.find("#pass").val(),
     ctrl  = $("#log_reg_popup .popup_login ").controller(),
     form  = this.element.find(".js-user-field-form"),
     self  = this;
    $("<form>").ajaxformbar({
      data:{user:{email:email,pass:pass}},
      url: "/" + window.language + "/login",
      set_html:false,
      beforeSend:function(){ self.set_loader(true);},
      success:function(resp){
        if(resp && resp.success){
          $.publish("login_success",[resp.user])
          $('#name').val(resp.user.name);
          $('#phone_number').val(resp.user.phone_number);
          $('#user_type').val(resp.user.user_type);
          el = self.element.find('.js-user-phone-code');
          if( el.find("option[value='"+resp.user.phone_code+"']").length > 0 ) {
            el.find("option").removeAttr('selected');
            el.find("option[value='"+resp.user.phone_code+"']").attr('selected','selected');
            el.parent().find('span.input-text').text(el.find("option[value='"+resp.user.phone_code+"']").text())
          }
          self.hide_login_form();
          self.set_loader(false);
          $('.js-add-passenger').show();
          // $('#name').focus();
        }
        else{
          ctrl.login_failed(resp.errors,form)
          self.set_loader(false);
        }
      }
    }).submit();
  },


  fill_passengers_checkboxes:function(key, one_pass){
    if(one_pass['doc_no_expiration'] == undefined){
      var input = $('#doc_expire_date_'+key);

      if(!$('#checkbox-validity-'+key).is(":checked") && input.hasClass('mobile_date_valid')){
        input.attr('disabled','disabled');
        input.removeAttr('required');
        input.removeClass('mobile_date_valid');
      }
      $('#checkbox-validity-'+key).parents('.passenger-data-inputs').find('.js-splited-date.js-doc-expire').addClass('hidden').find('input').attr('disabled', 'disabled');
      if($('#checkbox-validity-'+key).is(":checked")) $('#checkbox-validity-'+key).click();
    }else{
      if(!$('#checkbox-validity-'+key).is(":checked")){
        setTimeout(function(){
          $('#checkbox-validity-'+key).click();
          $('#checkbox-validity-'+key).siblings('input').blur();
        },10)
      }
    }
    if(one_pass['patronymic'] == undefined){
      if($('#patronymic-validity-'+key).is(":checked")) $('#patronymic-validity-'+key).click();
    }else{
      if(!$('#patronymic-validity-'+key).is(":checked")) $('#patronymic-validity-'+key).click();
    }

    if(one_pass['bonus_card'] == undefined){
      if($('#card_'+key).is(":checked")) $('#card_'+key).click();
    }else{
      if(!$('#card_'+key).is(":checked")) $('#card_'+key).click();
    }
  },

  fill_genger_data:function(key, value){
    $('#'+$('.js-gender-tab-'+key+'.'+value).attr('for')).change();
    $('.js-gender-tab-'+key+'.'+value).addClass('active');
  },

  fill_passengers_data:function(){
    var self = this;
    exc = ['type','id','gender','citizenship_name','citizenship','bonus_card','type', 'save_user_info']
    $.each(passengers_data, function(key, one_pass){
      self.fill_passengers_checkboxes(key, one_pass)
      $.each(one_pass, function(key_field, value){
        if( $.inArray(key_field, exc) > -1 ){
          switch(key_field){
            case 'citizenship':
              el = $('#'+key_field+'_'+key);
              if(el && one_pass['citizenship_name']){
                el.val(value);
                $('#citizenship_name_'+key).val(one_pass['citizenship_name']).change();
                self.init_international_validation(value.toUpperCase(), el);
                self.set_docnum_validation_for_ru(el);
              }
              break;
            case 'gender':
              self.fill_genger_data(key, value);
              break;
            case 'bonus_card':
              if(value != ''){
                $('#card_'+key).parent().find('.iCheck-helper').click();
                $('#'+key_field+'_'+key).val(value);
              }
              break;
            case 'type':
              $('#pass-type-'+key).click();
              break;
            case 'save_user_info':
              // $('#save_user_'+key).click();
              break;
          }
        }else{
          $('#'+key_field+'_'+key).val(value);
        }
      });
    });
    $('.one-passenger-data input:focus').blur()
    if(window.is_mobile) self.fix_ipad_field_madness();
  },
  fill_user_data:function(){
    this.element.find('#email').val(user_data.email);
    if(!logged_in){
      this.element.find('#email').blur();
    }
    this.element.find('#name').val(user_data.name);
    this.element.find('#phone_number').val(user_data.phone);
    $('select[name="user[phone_code]"]').val(user_data.phone_code).trigger("chosen:updated").trigger("chosen:close")
    this.element.find('span.js-user-phone-code.input-text').text(user_data.phone_code);
  },
  validation_passengers: function(){
    var self = this;
    $.each(validation_passengers_errors, function(key, error_text){
      if(/(birthday|doc_expire_date|gender)/.test(key)){
        var matched = /(birthday|doc_expire_date|gender)/.exec(key);
        var number_key = key.substr(-1);
        if(matched[0] == 'gender'){
          matched[0] = 'passengers_gender';
          number_key += '-M';
          error_text = validation_errors['tab_gender_valid']
        }
        if(matched[0] == 'doc_expire_date'){
          matched[0] = 'doc_expire_date_year'
        }
        if(matched[0] == 'birthday' ){matched[0] = 'birthday_month'}
        self.set_tooltip($('#'+matched[0]+'_'+number_key), error_text);
        self.scroll_to('first_error_label', 500);
      }else{
        self.set_tooltip($('#'+key), error_text);
        self.scroll_to('first_error_label', 500);
      }
    });
  },
  scroll_to:function(type, speed, c_el, with_focus, plus_minus){
    with_focus = (with_focus == undefined)?true:with_focus
    plus_minus = parseInt(plus_minus) || 60;
    c_el = c_el || '';
    var self = this, el = '';
    switch (type) {
      case 'top':
        el = $('body');
        with_focus = false;
        break;
      case 'element':
        el = c_el;
        break;
      case 'first_error_field':
        el = this.element.find('[name][required].error:first');
        with_focus = false;
        break;
      case 'first_error_label':
        el = this.element.find('samp.error:first');
        with_focus = false;
        break;
      case 'first_unfilled':
        var first_unfilled = '';
        this.element.find("[name][required]:not(:disabled)").each(function(){
          if($(this).val() === ""){
            first_unfilled = $(this);
            return false;
          };
        });
        el = first_unfilled;
        break;
      case 'next_unfilled':
        var c_el_i = 0;
        if(c_el){
          c_el_i = this.element.find("[name][required]:visible:not(:disabled)").index(c_el);
        }else{
          c_el_i = this.element.find("[name][required]:visible:not(:disabled)").index(this.element.find("[name][required]:focus"));
        }
        var next_unfilled = '';
        this.element.find("[name][required]:visible:not(:disabled):gt("+c_el_i+")").each(function(){
          if($(this).attr('type') == 'radio'){
            if(!self.element.find('[name = "'+$(this).attr('name')+'"]:checked').length > 0){
              next_unfilled = $(this);
              return false;
            }
          }
          if($(this).val() === ""){
            next_unfilled = $(this);
            return false;
          };
        });
        el = next_unfilled;
        break;
      default:
    }
    if(el.length > 0){
      $('html, body').animate({ scrollTop: parseInt(el.offset().top)-plus_minus}, speed);
      if(with_focus){
        el.focus();
      }
    }
    return el;
  },
  load_full_recommendation:function(){
    var params = this.get_cleared_params();
    if(params){
      $.ajax({
        url: '/search/load_recomendation_for_cache',
        data: params,
        type: 'GET',
        dataType:"json",
        timeout:90000,
        success: function(response, textStatus, jqXHR){
        },
        error: function(jqXHR,textStatus,errorThrown ){
        }
      });
    }
  },
  return_back_after_logout:function(){
    if($('.js-logout')){
      $('.js-logout').attr('href', $('.js-logout').attr('href')+'?rtr=yes');
    }
  },

  check_interaction: function( input ){

    var interaction_type = this.get_interaction_page_type( input );

    if( this.parent.INTERACTION_LIMIT == this.filed_chars[ interaction_type ] ){
      var interaction_code = 1000 + interaction_type ;
      window.klog( interaction_code, JSON.stringify({ input: input.attr("name")}) , window.session_id );
    }
    this.filed_chars[ interaction_type ] = this.filed_chars[ interaction_type ] + 1;
  },

  get_interaction_page_type: function( input ){

    if( input.hasClass( "valid_card_number" ) || input.parents(".card-wrapper").length || input.parents(".card_wrapper").length ){
      return this.parent.PAYMENT_CARD_INTERACTION
    }
    return ( ( window.location.pathname.indexOf("pre_booking") > -1 ) ? this.parent.PREBOOKING_PAGE_INTERACTION : this.parent.BOOKING_PAGE_INTERACTION )
  },

  pb_setup_submit:function(){
    var self = this;
    this.element.find("form").ajaxformbar({
        load_time:180,
        hide_on_success: self.parent.hide_on_success,
        start: 10,
        success_tag: 'success',
        beforeSend:function(jqXHR, settings){
          if(settings.crossDomain){
            settings.url = settings.url.replace(settings.url.split("/")[2],window.location.host);
            jqXHR.setRequestHeader('X-Requested-With','XMLHttpRequest');
          }
          var passengers = self.element.find('[class *= "js-passenger-info-"]'),
              user_names = [];
          passengers.each(function(key, val){
            var name = $(val).find('[id *= "firstname_"]'),
                lastname = $(val).find('[id*="lastname_"]'),
                str = ((lastname.length > 0)?lastname.val():'')+':'+((name.length > 0)?name.val():'');
            user_names.push(str);
          });
          settings.url = settings.url+'&user_names='+user_names.join(';');
        },
        success: function(response, textStatus, jqXHR){
          self.pb_success_call_back(response);
        },
        error: function (xhr, ajaxOptions, thrownError) {
          self.pb_error_call_back(xhr, ajaxOptions, thrownError)
        }
    });
  },
  pb_success_call_back: function(data){
    var self = this;
    if(data.success){
      if(self.element.find("form").data('fast-loader-message')) {
        var texts = self.element.find("form").data('fast-loader-message');
        message('msg_title', texts.msg, texts.btn, function(){location.href = texts.url; return false }, false, true);
      }else {
        location.href =  "/" + window.lang_prefix + window.gds + "/search/booking"+ "?" + self.get_cleared_params() + '&ig_r=1';
      }
    }else if(Object.keys(data.errors).length > 0){
      self.pb_sc_hide_loader();
      validation_passengers_errors = data.errors;
      self.validation_passengers();
    }else{
      message('msg_title', I18n.server_error, 'continue_button', window.close_message);
    }
  },
  pb_error_call_back: function( xhr, ajaxOptions, thrownError ){
    if(xhr.status && (typeof(session_id)!="undefined")) log_error(''+xhr.status+': '+thrownError, ((typeof(session_id)!="undefined" ? session_id : "")||''), '');
    message('msg_title', I18n.server_error, 'continue_button', window.close_message);
  },
  pb_sc_hide_loader: function(){
  },
    //fix expiration-date
  fix_ipad_field_madness: function(){
    if((/iphone|ipad|ipod/i).test(navigator.userAgent.toLowerCase())){
      $('[id*="doc_expire_date_"]:not(:disabled)').attr('disabled','disabled').addClass('ipad-fix');
      setTimeout(function(){$('[id*="doc_expire_date_"].ipad-fix').removeAttr('disabled').removeClass('ipad-fix')},100);
    }
  },

  get_cleared_params: function(){
    var params = {};
    decodeURIComponent(location.search.substr(1)).split('&').map(function(v){var s = v.split('='); params[s[0]] = s[1] });
    delete params["from"]
    return $.param(params);
  },

  fast_preloader_init_search: function(){
    var self = this;
    IntermediateAviaBookingController.form_btn_ready = false;
    $.ajax({
      url: search_url,
      data: JSON.parse(preloader_form_fields),
      type: 'POST',
      dataType:"json",
      timeout: 90000,
      success: function(response, textStatus, jqXHR){
        url_prefix = window.lang_prefix != '' ? "/" + window.lang_prefix : "/";
        url_prefix += Number(window.has_subdomais) ? "" : window.cur_domain_name + "/"

        var query = $.parseParams(window.location.search.replace("?",""));

        if (undefined !== query['refid'] && undefined !== response.params) {
          response.params['refid'] = query['refid'];
        }

        if(response.code === false){
          rd = response.action == 'results' ? 1 : (response.action == 'booking' ? 2 : 0);

          if(response.action == 'results' && response.message) self.element.find("form").data('fast-loader-message', response.message)

          if(window.cur_domain == 'avia'){ window.tracking(1, 1, response.params.session_id, 0, rd); }
          var fp = response.params.fp;
          delete response.params.fp;
          window.history.replaceState(null, null, location.origin + location.pathname + "?" + $.param(response.params));

          if(fp) response.params.fp = fp;

          self.fast_preloader_success_callback(response);
          IntermediateAviaBookingController.form_btn_ready = true;
          if(response.action != 'results') self.load_full_recommendation();
        }else{
          $(window).unbind('beforeunload');
          if(window.cur_domain == 'avia'){ window.tracking(1, 2, '', 0); }
          message('msg_title', response.msg, 'continue_button', function(){window.location.href =  url_prefix;  return false });
        }
      },
      error: function(jqXHR,textStatus,errorThrown ){
        if(window.cur_domain == 'avia'){ window.tracking(1, (textStatus==="timeout" ? 3 : (IntermediateAviaBookingController.tr_error_reason ? IntermediateAviaBookingController.tr_error_reason: 4) ), '', 0); }
        if(typeof(jqXHR.status) != "undefined") log_error( jqXHR.status+': '+textStatus + ' ' + errorThrown, '', window.location.href);
        $(window).unbind('beforeunload');
        message('msg_title', window.I18n.server_error, 'continue_button', function(){window.location.href =  '/' + window.lang_prefix;  return false });
      }
    });
  },
  fast_preloader_success_callback: function(response){
  },
  ".js-patronymic-checker -> change":function(el){
    var el = $(el.target),
        input = this.element.find('#patronymic_'+el.data('key')),
        state = el.is(":checked");
    input.removeClass("error").siblings('.error').remove();
    input.attr({'disabled': !state, 'required': state}).
          rules('add', {middlenameLength: state, latinName: state});
    el.val(state);
  },
  // FUNCTIONS END
});
