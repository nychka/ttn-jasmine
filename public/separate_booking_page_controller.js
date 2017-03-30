// WARNING. Code written lower can damage your psychics
$.Controller("SeparateBookingPageController",{
  init:function(){
    var self = this;
    try {
      var page_position = self.get_page_position();

      var ins = $('[data-auto-controller="InsuranceWithAviaController"]').length > 0 || $('#insurance_with_avia').length > 0,
          aero = $('.js_aeroexpress').length > 0,
          euro_u = $('[data-auto-controller="EuroUpsaleController"]').length > 0,
          transfer = false,
          add_serv = $('#additional_services').length > 0;

      if(!(ins || aero || transfer || add_serv)){
        self.hide_separate();
        self.hide_loader();
        return;
      }else{
        if(!add_serv && (!$('.js-additional-transfer__content').length && $('.js-additional-service__transfer').length)){
          var service_load_fail = function(){
            if(!(page_position == 'after_book' && $('.js-separate-page:visible').length > 0)){
              message('msg_title', window.no_add_services, 'paid_btn', function(){
                window.close_message();
                $('.js-book-button').click();
              });
              $('.js-popup-btn').text($('.js-book-button').val()).after('<a href="javascript:void(0);" class="btn js-msg-result-btn">'+$('.js-bread-cumbs-search-result a').text()+'</a>');
              $('.js-msg-result-btn').on('click', function(){
                window.close_message();
                $(window).unbind('beforeunload');
                location.href = $('.js-bread-cumbs-search-result a').attr('href');

              })
            }
            self.hide_separate();
          }
          var time = function(){
            setTimeout(function(){
              if(ins && transfer){
                if(check_add_serv_status.get_service_status('insurance') == 2 || check_add_serv_status.get_service_status('transfer') == 2)
                  return true;
                if(check_add_serv_status.get_service_status('insurance') < 2 || check_add_serv_status.get_service_status('transfer') < 2)
                  time();
                if(check_add_serv_status.get_service_status('insurance') > 2 && check_add_serv_status.get_service_status('transfer') > 2)
                  service_load_fail();
              }else if(ins){
                if(check_add_serv_status.get_service_status('insurance') == 2)
                  return true;
                if(check_add_serv_status.get_service_status('insurance') < 2)
                  time();
                if(check_add_serv_status.get_service_status('insurance') > 2)
                  service_load_fail();
              }else if(transfer){
                if(check_add_serv_status.get_service_status('transfer') == 2)
                  return true;
                if(check_add_serv_status.get_service_status('transfer') < 2)
                  time();
                if(check_add_serv_status.get_service_status('transfer') > 2)
                  service_load_fail();
              }
            }, 100);
          }
          time();

        }

      }
      if(page_position){
        if(page_position == 'before_book'){
          self.separate_page('additional', page_position);
          self.scroll_to($('#header'), 500, 0);
        }else if(page_position == 'after_book'){
          if($('.js-separate-bread-crumbs').index() < $('.js-bread-crumbs-pay').index()) self.fix_bread_crums();
          self.scroll_to($('#header'), 10, 0);
          self.separate_page('booking', page_position);
          setTimeout(function(){
            self.scroll_to_payment_or_top();
          }, 400);

          setTimeout(function(){
            self.recalculate_prices();
            self.reload_price_calculation_obj();
          }, $('.payment_block').controller().cost.waitingServiceTime*2)
        }

        self.hide_loader();
        self.set_events(page_position);
      }
    }catch(e) {
      window.onerror(e.message, e.fileName, e.lineNumber, e.columnNumber, e);
      $(window).unbind('beforeunload');
      location.href = location.href.split('#')[0]+"&ig_sp=1";
    }
  },
  // EVENTS START
  // EVENTS END

  // FUNCTION START
  get_page_position: function(){
    var self = this,
        page_position = self.element.data('page-possition');
    if(page_position && (page_position == 'before_book' || page_position == 'after_book')){
      if(($('.s7-recommendations-block').length > 0 ||
           ($('.booking_recommend_block.youve_choosen').length > 0 || $('.booking_recommend_block.we_recommend') > 0) ||
            $('#fly-class_popup').length > 0 ||
            ['kyiavia_cash','credit'].some(function(ps_type) { return $('[data-group='+ps_type+']').length}) ||
            $('.js_inline_grid_ff').length > 0
          ) && page_position == 'before_book'
        ){
        page_position = 'after_book';
      }
    }else{
      page_position = false
    }
    return page_position;
  },

  fix_bread_crums: function(){
    $('.js-separate-bread-crumbs').removeClass('active');
    $('.js-bread-crumbs-pay').addClass('active');
    $('.js-bread-crumbs-pay').after($('.js-separate-bread-crumbs').next('.arrows:first'));
    $('.js-bread-crumbs-pay').next('.arrows:first').after($('.js-separate-bread-crumbs'));
  },
  //hide_separate та show_separate використовувати тільки якщо в данний момент показується сторінка booking і тільки якщо позиція сторінки додаткових послуг after_book
  hide_separate: function(){
    var self = this;
    self.reset_price_calculation_obj();
    $('.js-about-flight, .js-users-data, .payment_block, .seats-left-block').removeClass('hidden');

    var on_board_head = $('.js-additional-services').find('[data-tab-service-name="on_board"]'),
        on_board_body = $('.'+on_board_head.data('attr'));

    on_board_head.parents('.js-tab-wrapper').addClass('hidden')
    $('.js-additional-services .js-tab-wrapper .js-tab-item').removeClass('hidden');

    if($('[data-auto-controller="InsuranceWithAviaController"]').css('display') == 'none'){
      $('[data-tab-service-name="service"]').addClass('hidden');
      $('.'+$('[data-tab-service-name="service"]').data('attr')).addClass('hidden');
    }
    on_board_body.removeClass('active');
    $('.js-additional-services .js-tab-block .additional-service').not('.hidden').first().addClass('active');
    if(on_board_body.find('.extras .extra-item').length  == 0) on_board_body.removeClass('active');

    if($('.js-additional-services .js-tab-item:not(".hidden")').length <= 1) $('.js-additional-services .js-tab-block .js-tab-wrapper').addClass('hidden');
    else $('.js-additional-services .js-tab-block .js-tab-wrapper').removeClass('hidden');

    $('.js-sp-on_board').removeClass('hidden');
    $('.js-additional-services').removeClass('hidden');

    $('#additional_services').removeClass('hidden');
    $('.js_aeroexpress').removeClass('hidden');
    $('.booking_recommend_block.youve_choosen').removeClass('hidden');
    $('.booking_recommend_block.we_recommend').removeClass('hidden');
    $('.s7-recommendations-block').removeClass('hidden');
    $('.fly-class').show();
    $('#acceptIATA').removeClass('hidden');
    if(!$('.order-price').hasClass('js-add-price-off')) $('.order-price').removeClass('hidden');
    $('.js-separate-page').parent().hide();
    $('.js-book-button').parent().show();
    $('.js-cloned-bpb-p').hide();
    $('.js-origin-bpb-p').show();
    $('.js-separate-bread-crumbs').hide().next('.arrows:first').hide();
    $('.js_inline_grid_ff').removeClass('hidden');
    self.recalculate_prices(true);
  },

  show_separate: function(){
    var self = this,
        page_position = self.get_page_position();
    if(page_position == 'before_book'){
      self.separate_page('additional', page_position);
    }else if(page_position == 'after_book'){
      self.separate_page('booking', page_position);
      self.recalculate_prices();
    }
    $('.js-separate-bread-crumbs').show().next('.arrows:first').show();
  },

  set_events: function(page_position){
    var self = this;
      $('.js-separate-page').on('click', function(){
        try {
          if(page_position == 'before_book') {
            self.show_loader();
            self.separate_page('booking', page_position);
            self.bread_crumbs(page_position);
            self.scroll_to_payment_or_top();
            if(window.location.hash != '#sp') window.location = "#sp"
          }else if(page_position == 'after_book') {
            var form_valid = $('#js-booking-form').valid();

            var checkbox = $("#accept_checkbox");

            var card_link = $("#lcc_charge_data");
            if(card_link.length && card_link.data('hide_charge_popup') !== true){
                $(".js_lcc_charge_data_accept").addClass('js-open-from-sp');
                card_link.trigger('click');
            }else if($('.error:not(.accept_checkbox)').length == 0 && !checkbox.is(":checked") ){
              $('.acception_popup_accept').addClass('js-open-from-sp')
              $("#acception_popup_link").trigger('click');
            }else if(form_valid){
              self.show_loader();
              self.bread_crumbs(page_position);
              self.separate_page('additional', page_position);
              self.reset_price_calculation_obj();
              self.recalculate_prices(true);
              if(typeof insWithAviaObj != "undefined") self.check_insurance_load();
              self.scroll_to($('#header'), 500, 0);
              if(window.location.hash != '#sp') window.location = "#sp"
            }else{
              var pm = 60;
              if($('#js-booking-form').find('samp.error:first:visible').attr('for').indexOf('card-type') > 0) pm = 140;
              self.scroll_to($('samp.error:first:visible'), 500, pm);
            }
          }
          self.hide_loader();
        }catch(e) {
          self.show_loader();
          window.onerror(e.message, e.fileName, e.lineNumber, e.columnNumber, e);
          $(window).unbind('beforeunload');
          location.href = location.href.split('#')[0]+"&ig_sp=1";
        }
      })

      if(location.hash == "#sp"){
        if(document.referrer && document.referrer.indexOf('?') != -1){
          var search_refer = {}; document.referrer.split('?')[1].split('&').map(function(i,v){ var tmp = i.split('='); search_refer[tmp[0]] = tmp[1] })
          var search_href = {}; location.href.split('?')[1].split('&').map(function(i,v){ var tmp = i.split('='); search_href[tmp[0]] = tmp[1] })
        }

        if((document.referrer && document.referrer.indexOf('?') != -1) || document.referrer.indexOf('search/booking') == -1 ||
            search_refer['recommendation_id'] && search_href['recommendation_id'] && search_refer['recommendation_id'] == search_href['recommendation_id'] &&
            search_refer['session_id'] && search_href['session_id'] && search_refer['session_id'] == search_href['session_id']){
          history.back();
        }else{
            history.replaceState(null, null, location.href.split('#')[0]);
        }

      }
      window.onpopstate = function(event) {
        if(location.hash == "#sp" && $('.js-separate-page:visible').length > 0){
          $('.js-separate-page:visible').click();
        }else if(location.hash == '' && $('.js-book-button:visible').length > 0 ){
          if(page_position == 'before_book'){
            $('.js-separate-bread-crumbs').click();
          }else if(page_position == 'after_book'){
            $('.js-bread-crumbs-pay').click();
          }
        }
      };
  },

  separate_page: function(type, page_position){
    var on_board_head = $('.js-additional-services').find('[data-tab-service-name="on_board"]'),
        on_board_body = $('.'+on_board_head.data('attr')),
        insurance_tab = $('.additional-service__insurance'),
        services_texts = [];
    if(insurance_tab.data('view')) services_texts.push('ins')
    if(!$('.js-cloned-bpb-p').length){
      var tmp = $('.booking_price_button p').clone();
      $('.booking_price_button p').addClass('js-origin-bpb-p')
      tmp.addClass('js-cloned-bpb-p').hide().find('*').filter(':not('+services_texts.join(',')+')').remove();
      $('.js-origin-bpb-p').after(tmp)
    }
    switch (type) {
      case "additional":
        $('.js-about-flight, .js-users-data, .payment_block, .seats-left-block').addClass('hidden');

        //tabs headers
        on_board_head.addClass('hidden');
        if($('[data-auto-controller="InsuranceWithAviaController"]').css('display') == 'none'){
          $('[data-tab-service-name="service"]').addClass('hidden');
          $('.'+$('[data-tab-service-name="service"]').data('attr')).addClass('hidden');
        }

        if($('.js-additional-services .js-tab-item:not(".hidden")').length > 1) $('.js-additional-services .js-tab-block .js-tab-wrapper').removeClass('hidden')
        else  $('.js-additional-services .js-tab-block .js-tab-wrapper').addClass('hidden');
        //tabs content
        on_board_body.removeClass('active');
        $('.js-additional-services .js-tab-block .additional-service').not(on_board_body).not('.hidden').first().addClass('active');
        if(insurance_tab.length && insurance_tab.data('view')) insurance_tab.parent().removeClass('active');

        $('.js-sp-on_board').addClass('hidden');
        $('#additional_services').removeClass('hidden');
        $('.js_aeroexpress').removeClass('hidden');
        $('[data-auto-controller="EuroUpsaleController"]').removeClass('hidden');
        if(page_position == 'before_book'){
          $('.js_inline_grid_ff').removeClass('hidden');
          $('.booking_recommend_block.youve_choosen').removeClass('hidden');
          $('.booking_recommend_block.we_recommend').removeClass('hidden');
          $('.header-lang ').removeClass('hidden')
          $('.s7-recommendations-block').removeClass('hidden');
          $('.fly-class').show();
          $('#acceptIATA').addClass('hidden');
          $('.order-price').addClass('hidden');
          $('.js-separate-page').parent().show();
          $('.js-book-button').parent().hide();

          $('.js-cloned-bpb-p').show();
          $('.js-origin-bpb-p').hide();
        }else if(page_position == 'after_book'){
          $('.js_inline_grid_ff').addClass('hidden');
          $('.header-lang ').addClass('hidden');
          $('.booking_recommend_block.youve_choosen').addClass('hidden');
          $('.booking_recommend_block.we_recommend').addClass('hidden');
          $('.s7-recommendations-block').addClass('hidden');
          $('.fly-class').hide();
          $('#acceptIATA').addClass('hidden');
          if(!$('.order-price').hasClass('js-add-price-off')) $('.order-price').removeClass('hidden');
          $('.js-separate-page').parent().hide();
          $('.js-book-button').parent().show();

          $('.js-cloned-bpb-p').hide();
          $('.js-origin-bpb-p').show();
        }
        break;
      case "booking":
        $('.js-about-flight, .js-users-data, .payment_block, .seats-left-block').removeClass('hidden');

        //tabs headers
        if(on_board_head.css('display') == 'none' && !on_board_head.hasClass('hidden')) on_board_head.addClass('hidden');
        else on_board_head.removeClass('hidden');
        $('.js-sp-on_board').removeClass('hidden');

        setTimeout(function(){
          $('.js-additional-services .js-tab-block .js-tab-wrapper').addClass('hidden');
        },100);
        //tabs content
        $('.js-additional-services .js-tab-block .additional-service').removeClass('active');
        if(insurance_tab.length && insurance_tab.data('view')) insurance_tab.parent().addClass('active');
        if(on_board_body.find('.extras .extra-item').length > 0) on_board_body.addClass('active');
        else on_board_body.removeClass('active');

        $('#additional_services').addClass('hidden');
        $('#acceptIATA').addClass('hidden');
        $('.js_aeroexpress').addClass('hidden');
        $('[data-auto-controller="EuroUpsaleController"]').addClass('hidden');
        if(page_position == 'before_book'){
          $('.js_inline_grid_ff').addClass('hidden');
          $('.booking_recommend_block.youve_choosen').addClass('hidden');
          $('.booking_recommend_block.we_recommend').addClass('hidden');
          $('.s7-recommendations-block').addClass('hidden');
          $('#acceptIATA').removeClass('hidden');
          if(!$('.order-price').hasClass('js-add-price-off')) $('.order-price').removeClass('hidden');
          $('.js-separate-page').parent().hide();
          $('.js-book-button').parent().show();
          $('.fly-class').hide();
          $('.header-lang ').addClass('hidden')

          $('.js-cloned-bpb-p').hide();
          $('.js-origin-bpb-p').show();
        }else if(page_position == 'after_book'){
          $('.js_inline_grid_ff').removeClass('hidden');
          $('.booking_recommend_block.youve_choosen').removeClass('hidden');
          $('.booking_recommend_block.we_recommend').removeClass('hidden');
          $('.s7-recommendations-block').removeClass('hidden');
          $('#acceptIATA').removeClass('hidden');
          $('.order-price').addClass('hidden');
          $('.js-separate-page').parent().show();
          $('.js-book-button').parent().hide();
          $('.fly-class').show();
          $('.header-lang ').removeClass('hidden')
          $('.js-cloned-bpb-p').show();
          $('.js-origin-bpb-p').hide();
        }

        $('.main').resize();
        break;
    }
    // if($('.js-additional-services .js-tab-item:not(".hidden")').length <= 1) $('.js-additional-services .js-tab-wrapper').addClass('hidden');
    // else $('.js-additional-services .js-tab-wrapper').removeClass('hidden');
    $('.js-additional-services').removeClass('hidden');
  },

  bread_crumbs: function(page_position){
    var self = this;
    if(page_position == 'before_book') {
      $('.js-separate-bread-crumbs').removeClass('active');
      $('.js-separate-bread-crumbs').wrapInner("<a href='javascript:void(0)'></a>");
      $('.js-bread-crumbs-pay').addClass('active');
      $('.js-separate-bread-crumbs').off('click');
      $('.js-separate-bread-crumbs').on('click', function(e){
        if (e.originalEvent !== undefined) history.back();
        self.show_loader();
        self.separate_page('additional', page_position);
        self.scroll_to($('#header'), 500, 0);
        $('.js-separate-bread-crumbs').addClass('active');
        $('.js-separate-bread-crumbs').off('click');
        $('.js-separate-bread-crumbs a').replaceWith( $('.js-separate-bread-crumbs a').text() );
        $('.js-bread-crumbs-pay').removeClass('active');
        self.hide_loader();
      })
      $('.js-bread-crumbs-pay').addClass('active');
    }else if(page_position == 'after_book'){
      $('.js-separate-bread-crumbs').addClass('active');
      $('.js-bread-crumbs-pay').removeClass('active');
      $('.js-bread-crumbs-pay').off('click');
      $('.js-bread-crumbs-pay').html("<a href='javascript:void(0)'>"+$('.js-bread-crumbs-pay').text()+"</a>");
      $('.js-bread-crumbs-pay').on('click', function(e){
        if (e.originalEvent !== undefined) history.back();
        self.show_loader();
        self.separate_page('booking', page_position);
        if($('.error').length == 0) self.scroll_to_payment_or_top();
        else self.scroll_to($('.error:first'), 10, 50)
        $('.js-separate-bread-crumbs').removeClass('active');
        $('.js-bread-crumbs-pay').addClass('active');
        $('.js-bread-crumbs-pay a').replaceWith( $('.js-bread-crumbs-pay a').text() );
        $('.js-bread-crumbs-pay').off('click');

        self.recalculate_prices();

        self.hide_loader();
      })
    }
  },

  recalculate_prices: function(full){
    if(full){
      if(typeof insWithAviaObj != "undefined" && PriceCalculationObj.calculationServices.indexOf(insWithAviaObj) == -1) PriceCalculationObj.addService(insWithAviaObj);
      if(typeof additionalServicesObj != "undefined") PriceCalculationObj.addService(additionalServicesObj);

      $('#addP_ins_with_avia').show();
      $('[id *= "addP_additional-service"]').show();
    }else{
      var tmp_arr = []
      $.each(PriceCalculationObj.calculationServices, function(i, obj){
        if(!((typeof InsuranceWithAvia != "undefined" && obj instanceof InsuranceWithAvia) || (typeof AdditionalServices != "undefined" && obj instanceof AdditionalServices))) tmp_arr.push(obj);
      })
      if(typeof insWithAviaObj != "undefined" && $('.additional-service__insurance').data('view')) tmp_arr.push(insWithAviaObj);
      PriceCalculationObj.calculationServices = tmp_arr;
      $('#addP_ins_with_avia').hide();
      $('[id *= "addP_additional-service"]').hide();
    }
    $('.payment_block').controller().cost.reload();
  },

  reload_price_calculation_obj: function(){
    PriceCalculationObj.addService = function(obj, hard){
      if(hard || !((typeof InsuranceWithAvia != "undefined" && obj instanceof InsuranceWithAvia) || (typeof AdditionalServices != "undefined" && obj instanceof AdditionalServices))) this.calculationServices.push(obj);
      this.reloadPrice();
    }
  },

  reset_price_calculation_obj: function(){
    PriceCalculationObj.addService = function(obj){
      this.calculationServices.push(obj)
      this.reloadPrice();
    }
  },

  check_insurance_load: function(recalculate){
    var self = this;

    var time = function(){
      setTimeout(function(){
        if(!insWithAviaObj.load_form) {
          time();
        }else{
          if(recalculate) self.recalculate_prices();
          else $('.payment_block').controller().cost.reload();

        }
      }, 100);
    }
    time();
  },

  show_loader: function(){
    $('.js-separate-loader').removeClass('hidden');
  },
  hide_loader: function(){
    setTimeout(function(){
      $('.js-separate-loader').addClass('hidden');
    }, 500);
  },
  scroll_to_payment_or_top: function(){
    var self = this;
    if(scroll_to_payment && $('.s7-recommendations-block').length == 0 && $('.fly-class').length == 0) self.scroll_to($('.payment_block'), 500, 60);
      else self.scroll_to($('#header'), 500, 0);
  },
  scroll_to: function(el, speed, plus_minus){
    plus_minus = plus_minus || 0;
    speed = speed || 500;
    if (el){
      setTimeout(function(){
        $('html, body').animate({ scrollTop: parseInt(el.offset().top)-plus_minus}, speed)
      }, 10);
    }
  }
  // FUNCTION END
});
