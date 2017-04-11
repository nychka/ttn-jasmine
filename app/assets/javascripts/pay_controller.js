$.Controller("Payment/payController", {
    proc_response_url:  null,
    wait: 5000,
    attempts: 0,
    max_attempts: 20,
    checker: null,
    iframe_redirect: false,

  init:function(){
    var self = this;
    if($('#check_status').length)
      setTimeout(self.check_status, 2000);

    self.appendAutotab();
    this.element.find('.field input').removeAttr("disabled");
  },
  appendAutotab: function(){
    this.element.find('#post_card_number_1').autotab({ format: 'number', target: '#post_card_number_2' });
    this.element.find('#post_card_number_2').autotab({ format: 'number', target: '#post_card_number_3', previous: '#post_card_number_1' });
    this.element.find('#post_card_number_3').autotab({ format: 'number', target: '#post_card_number_4', previous: '#post_card_number_2' });
    this.element.find('#post_card_number_4').autotab({ format: 'number', target: '#post_month', previous: '#post_card_number_3' });

    this.element.find('#post_month').autotab({ format: 'number', target: '#post_year', previous: '#post_card_number_4' });
    this.element.find('#post_year').autotab({ format: 'number', target: '#post_owner', previous: '#post_month' });
    this.element.find('#post_owner').autotab({ format: 'custom',target: '#post_cvv', pattern: '[^a-zA-Z -\.]', previous: '#post_year' });

    this.element.find('#post_cvv').autotab({ format: 'number', previous: '#post_owner' });
  },
  ".payment_block .card_block form input -> keyup":function(ev) {
    $('.card_block #update_attribute .errors').toggleClass('show', false);
  },
  ".card_block form input.number -> keyup":function(ev) {
    reg = /[0-9]/
    if (!reg.test(String.fromCharCode((96 <= ev.which && ev.which <= 105)? ev.which-48 : ev.which)) && ev.which != 13)
        $(ev.target).parents('.rel').find('.errors').toggleClass('show', true);
    else
        $(ev.target).parents('.rel').find('.errors').toggleClass('show', false);
  },
  ".card_block form #post_owner -> keyup":function(ev) {
      reg = /[a-zA-Z -]/
      if (!reg.test(String.fromCharCode((96 <= ev.which && ev.which <= 105) ? ev.which-48 : ev.which)))
          $(ev.target).parents('.rel').find('.errors').toggleClass('show', true);
      else
          $(ev.target).parents('.rel').find('.errors').toggleClass('show', false);
  },
  ".payment_block input -> keyup":function(ev) {
      var post_month = $('.card_block form #post_month').val();
      if (post_month.length == 2 && (post_month > 12 || post_month == '00')) {
          $('.rel.card_expiry .errors').toggleClass('show', true);
      }

      var post_year = $('.card_block form #post_year').val();
      // var y = String((new Date).getFullYear());
      var current_year = Number(String((new Date).getFullYear()).substring(2));
      var current_month = (new Date).getMonth() + 1;
      if (post_year.length == 2 && (post_year < current_year || (post_year == current_year && post_month < current_month)))
          $('.rel.card_expiry .errors').toggleClass('show', true);

      var value = '';
      $.each($('.rel.card_number').find('.field input'), function(){
          value += $(this).val();
      });
      if (value.length == 16)
          $('.rel.card_number .errors').toggleClass('show', !$.payment.validateCardNumber($('#post_card_number_1').val() + $('#post_card_number_2').val() + $('#post_card_number_3').val() + $('#post_card_number_4').val()));
  },
  ".payment_way li -> click":function(ev) {
      var card_block = $('.card_block');

      $(".payment_way li.error").remove();
      if ($(ev.currentTarget).hasClass('bank_card')){
        if(!$(ev.currentTarget).find('.card_wrapper .card_block').length){
          card_block.remove().appendTo($(ev.currentTarget).find('.card_wrapper'));
          this.appendAutotab();
        }
        card_block.slideDown();
      }else{
        card_block.slideUp();
      }

      $(ev.currentTarget).siblings().removeClass('active');
      $(ev.currentTarget).addClass('active');
  },
  "#make_payment -> click":function(ev){
    this.make_payment(ev.target);
  },
  make_payment:function(that) {
    var validate = serializeForm($('.payment_page .payment_block .bank_card.active form'));
    var card_number = validate['post[card_number_1]'] + validate['post[card_number_2]'] + validate['post[card_number_3]'] + validate['post[card_number_4]'];
    var card_expiry_month = validate['post[month]'];
    var card_expiry_year = validate['post[year]'];
    var card_cvv = validate['post[cvv]'];
    var card_owner = validate['post[owner]'];
    if ($.isEmptyObject(validate) || ($.payment.validateCardNumber(card_number) && $.payment.validateCardExpiry(card_expiry_month, card_expiry_year) && $.payment.validateCardCVC(card_cvv) && card_owner.length >= 4)) {
        $(that).hide();
        $(that).siblings('img').show();
        $('.loader, .overlay').show();
        $(this).parents('.field').siblings('.errors').toggleClass('show', !$.payment.validateCardNumber($('#post_card_number_1').val() + $('#post_card_number_2').val() + $('#post_card_number_3').val() + $('#post_card_number_4').val()));

        block = $(that).parents('.payment_block').find('.payment_way li.active');
        if (block.hasClass('bank_card')) {
            var form = block.find('form');
            var values = serializeForm(form);
        }

        payment_system_id = block.find('div.title').attr('pay_id');
        var params = values ? {session_id: $(that).parents('.payment_block').find('input[name="session_id"]').val(), pan: (values['post[card_number_1]'] + values['post[card_number_2]'] + values['post[card_number_3]'] +values['post[card_number_4]']), cvv: values['post[cvv]'], exp_month: values['post[month]'], exp_year: values['post[year]'], cardholder: values['post[owner]'], payment_system_id: payment_system_id} : {session_id: $(that).parents('.payment_block').find('input[name="session_id"]').val(), payment_system_id: payment_system_id}

        this.make_payment_ajax(params, that);
    } else {
        if (!$.payment.validateCardNumber(card_number))
            $('.bank_card .rel.card_number .errors').toggleClass('show', true);
        if (!$.payment.validateCardExpiry(card_expiry_month, card_expiry_year))
            $('.bank_card .rel.card_expiry .errors').toggleClass('show', true);
        if (card_owner.length < 4)
            $('.bank_card .rel.card_owner .errors').toggleClass('show', true);
        if (!$.payment.validateCardCVC(card_cvv))
            $('.bank_card .cvv_block .errors').toggleClass('show', true);
    }
  },
  is_frame:function(data){
    var flag_iframe_redirect = typeof(data.flag_iframe_redirect) != 'undefined' ? data.flag_iframe_redirect : false;
    return (window != window.top) && !flag_iframe_redirect;
  },
  make_payment_ajax:function(params, that) {
    var self = this;
    $.ajax({
        url: '/makepayment' ,
        type: "POST",
        dataType: "json",
        data: params,
        finishProc: function(){
          $('.submit_block img, .loader, .overlay').hide();
          $(that).show();
        },
        beforeSend: function(){
            self.parent.proc_response_url = null;
            $('.payment_block .error').html('').hide();
        },
        success: function(data){
            location_href = self.is_frame(data) ? window.top.location : window.location;

            if(data.success) {
                if (data.order.is_paid && data.success_url){
                    location_href.href = data.success_url;
                }
                else if(data.url) {
                    if(typeof(js_params) != 'undefined' && typeof(js_params['redirect_in_popup']) != 'undefined' && js_params['redirect_in_popup'] == 1){

                        submit_form = url_redirect(data.url, 'get', null, true);
                        var wnd = $.popupWindow('', { height: 600, width: 900, onUnload: function(){
                            if(self.parent.proc_response_url != null){
                                window.location.href = self.parent.proc_response_url;
                            }
                        }});

                        if(wnd == null){
                          this.finishProc();
                          self.show_error('Для проведения платежа необходимо отключить блокировку всплывающих окон');
                        }else{
                            var doc = $(wnd.document.body);
                            doc.html(submit_form);
                            doc.find('form').submit();
                            if(typeof(data.order.response_url) != 'undefined'){
                                self.parent.proc_response_url = data.order.response_url;
                            }
                        }
                    }else{
                        location_href.href = data.url;
                    }
                }
            }  else {
              if(typeof(data.flag_strong_error) != 'undefined' && data.flag_strong_error){
                location_href.href = data.failure_url + '?error_msg=' + (typeof(data.error_msg) != 'undefined' ? data.error_msg : 'Error');
              }else{
                this.finishProc();
                self.show_error(data.error_msg);
              }
            }
        }
    });
  },
  "#check_status -> click":function(ev){
    this.check_status(false);
  },
  check_status:function(timeout) {
    var self = this;
    $('.loader, .overlay').show();
    $.ajax({
        url: '/check_status',
        type: "POST",
        dataType: "json",
        data: {link_reference: $('input.link_reference').val()},
        success: function(data){
          $('.loader, .overlay').hide();
          if(data.success == true && data.order.is_paid == true && $('input.success_url').length > 0)
             window.location.href = $('input.success_url').val();
          else if (data.success == false && typeof(data.error) != 'undefined' && $('input.failure_url').length > 0)
            window.location.href = $('input.failure_url').val() + '?error_msg=' + (typeof(data.error_msg) != 'undefined' ? data.error_msg : 'Error');
          else if (data.success == false && typeof(data.error_msg) != 'undefined')
            $('.payment_block .payment_way .error').html(data.error_msg).show();
          else{
            self.parent.attempts += 1;
            if(self.parent.attempts > self.parent.max_attempts)
                return;
            if(typeof(timeout) == 'undefined' || timeout)
                self.parent.checker = setTimeout(self.check_status, self.parent.wait);
          }
        }
    });
  },
  show_error:function(error_msg){
    if ($('.payment_block .error').length)
      $('.payment_block .error').html(error_msg).show();
    else {
      $('.payment_block .payment_way li.active').after('<li class="error">' + error_msg +'</li>');
      $('.payment #error_msg').html(error_msg);
    }
  },
  test:function(method) {
    var values = serializeForm($('#update_attribute'));
    $.ajax({
      url: '/ajax/test',
      type: "POST",
      dataType: "json",
      data: values,
      success: function(data){
         url_redirect('/pay' + method, 'post', data);
      }
    });
  },
});
