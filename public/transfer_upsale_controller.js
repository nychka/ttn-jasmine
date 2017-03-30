$.Controller("TransferUpsaleController",{

  init: function(){
    this.mainWrapp = $('.js-additional-service__transfer');
    this.translations_tag         = this.mainWrapp.find('.js-translations');
    this.total_block_text         = this.translations_tag.data('total-block-title');
    this.error_load               = this.translations_tag.data('error-load');
    this.error_user_change_route  = this.translations_tag.data('error-user-change-route');
    this.transfer_didnt_find      = this.translations_tag.data('error-transfer-didnt-find');
    this.loader                   = this.mainWrapp.children('.js-b_preloader');

    this.reload_elements();
  },

  reload_elements: function(){
    this.reload_transfer_autocomplete();
    this.reload_close_button();
    this.reload_transfer_input_focusout();
    this.reload_transfer_change_link();
    this.reload_transfer_checkboxes();
    this.load_no_extra();
    this.select_time();
  },

  reload_popups: function(){
    // for popups
    $(".js-choose-class").each(function(index){
      $(".js-choose-class").removeClass("js-just-clicked");
      var route = $(this).data('route-index');
      $(this).addClass("js-just-clicked").magnificPopup({
          fixedContentPos: 'auto',
          items: {
              src: $("#car_content_"+route+".js-type-car-content"),
              type: 'inline',
          }
        });
    });

    $(".js-want-this").click(function(){
      var choosen_transfer = $(this).parents(".js-want-this-car").clone();
      var magnificPopup = $.magnificPopup.instance; // save instance in magnificPopup variable
      choosen_transfer.addClass("choosen-cartype").insertAfter($(".js-just-clicked")).next().show();
      magnificPopup.close();
      $(".js-just-clicked").hide();
    });
    // end for popups
  },

  transfer_locations_autocomplete: function(el){
    var self = this;
    var transfer_item = el.parents('.js-transfer-item')
      , recommendation_id = transfer_item.find("#recommendation_id")

      , from_group      = transfer_item.find("#from_group_id")
      , from_group_name = transfer_item.find("#from_group_name")
      , from_group_id   = from_group.val()

      , to_group      = transfer_item.find("#to_group_id")
      , to_group_name = transfer_item.find("#to_group_name")
      , to_group_id   = to_group.val()

      , pass_count                = transfer_item.find("#transfer_passengers_count").val()
      , route_session_tag         = transfer_item.find("#transfer_route_session_id")
      , transfer_route_session_id = transfer_item.find("#transfer_route_session_id").val()
      , route_index               = transfer_item.find('#transfer_route_index').val()
      , direct                    = el.data('route')

      , change_link   = transfer_item.find('.js-change-transfer-route')
      , right_title   = transfer_item.find('.js-right-title')
      , item_detail   = transfer_item.find('.js-want-this-car')

      , info_block            = transfer_item.find('.js-right-title')
      , input_field           = info_block.find('input')
      , right_text            = info_block.find('.js-right-text')
      , right_location        = info_block.find('.js-right-location')
      , possible_booking_time = info_block.find('.js-possible-booking-time')
      , avia_time             = transfer_item.find('#transfer_avia_time').val()

      , loader                = transfer_item.children('.js-b_preloader').first()
      , error                 = transfer_item.children('.js-b_preloader').last()
      , route_loader          = transfer_item.find('.type .js-b_preloader');


    el.autocomplete({
      minLength: 0,
      selectFirst: true,
      autoFocus: true,
      delay: 600,
      source: function(req, add) {

        var data = {
          session_id:     transfer_route_session_id,
          lang:           language,
          term:           req.term,
          from_group_id:  ((direct == 'from_airport') ? from_group_id : to_group_id),
        };

        $.ajax({
          url:  "transfer_upsale_complite",
          type: 'post',
          data: $.param(data),
          success: function(response) {
            route_loader.hide();
            add(JSON.parse(response));
          }
        });
      },

      create: function(){
        $(".ui-autocomplete").addClass("transfer");
        $(this).bind('click',function(ev){
          ev.preventDefault();
          $(this).select();
          return false;
        });
      },

      open: function(event, ui) {
        if ($(".ui-menu-item:visible").length === 1) {
          return $($(this).data('autocomplete').menu.active).find('a:visible').trigger('click');
        }
      },

      search: function(event, ui) {
        el = $(event.target);
        route_loader.show();
      },

      select: function(event, ui) {
        var input = $(event.target);
        input.val( ui.item.name );

        var avia_data = $.parseParams(window.location.search.replace("?",""));

        var data = {
          session_id:       transfer_route_session_id,
          lang:             language,
          from_group_id:    from_group_id,
          from_group_name:  from_group_name.val(),
          to_group_id:      to_group_id,
          to_group_name:    to_group_name.val(),
          pass_count:       pass_count,
          route_index:      route_index,
          direct:           direct,
          avia_time:        avia_time,
          avia_session:     avia_data.session_id,
          avia_recommendation_id: avia_data.recommendation_id,
          payment_system_id: PriceCalculationObj.activePaymentSystemID()
        };

        var check_same = false;

        if (direct == 'to_airport'){
          data.from_group_id    = ui.item.code;
          data.from_group_name  = ui.item.name;
          if(transfer_item.find("#from_group_id").val() == ui.item.code) check_same = true;
        }else{
          data.to_group_id      = ui.item.code;
          data.to_group_name    = ui.item.name;
          if(transfer_item.find("#to_group_id").val() == ui.item.code) check_same = true;
        }

        if(check_same){
          self.transfer_close_button(input.parents('.js-right-title').find('.js-transfer-mfp-close'));
          input.val( '' );
          return;
        }

        $.ajax({
          url: "transfer_upsale_recommendations",
          type: 'post',
          data:  $.param(data),
          dataType: 'json',
          beforeSend:function(){
            loader.show();
          },
          fail: function(){
              console.log(self.error_user_change_route);
          },
          success: function(response) {
            loader.hide();

            if (response.status){

              $(transfer_item.find('.js-want-this-car')).remove();
              $(transfer_item).append(response.content);
              // var want_this_car_block = $(transfer_item).find('.js-transfer-item');
              $(transfer_item).find('.js-want-this-car').css('display', 'table');

              self.reload_transfer_checkboxes();
              self.count_transfer_total_cost();

              TransferService.prototype.initEvents();

              if (direct == 'to_airport'){
                from_group.val( ui.item.code );
                from_group_name.val( ui.item.name );
              }else{
                to_group.val( ui.item.code );
                to_group_name.val( ui.item.name );
              }

              route_session_tag.val(response.route_session_id);
              recommendation_id.val(response.recommendation_id);
              possible_booking_time.html( self.month_date_time_format(response.possible_booking_time) );
              right_location.html( ui.item.name );
              input.attr( 'placeholder', ui.item.name );


            }else{
              error.find('.loader').html(self.error_user_change_route);
              error.fadeIn(100).fadeOut(3000);
            }
            input.val('');
            self.transfer_close_button(input.parents('.js-right-title').find('.js-transfer-mfp-close'));
          }
        });

        return false;
      }
    }).data("autocomplete")._renderItem = function(ul, item) {
      return $("<li></li>").data("item.autocomplete", item).append("<a class='transfer'>" + item.name_format + "</a>").appendTo(ul);
    };

    var proxied_renderMenu = $.ui.autocomplete.prototype._renderMenu;
    el.data("autocomplete")._renderMenu = (function( ul, items ) {
      ul.addClass('ac-for-' + el.attr('id'));
      proxied_renderMenu.apply( this, [ul, items] );
    });
  },

  reload_transfer_autocomplete: function(){
    var self = this;
    $.each($(".js-additional-transfer__content").find(".autocomplete"), function(n, el){
      self.transfer_locations_autocomplete($(el));
      $(el).on("focus", function () {
        // $(this).autocomplete("search", "");
      });
    });
  },

  count_transfer_total_cost: function(){
    var total = 0;
    var transfer_total_price = $('.js-additional-transfer__total').find('.js-transfer-summ span.total');
    var payment_system_id = PriceCalculationObj.activePaymentSystemID();
    var payment_system_currency = transfer_total_price.find('.currency').text();
    $(".js-check-transfer").each(function(item,index){
      var this_transfer_item = $(this).parents(".js-transfer-item");
      var button_label = this_transfer_item.find(".js-check-transfer-label");
      var price = 0;

      var data_span = this_transfer_item.find(".js-transfer-offer__item__price span[data-payment_system_id='"+payment_system_id+"']");
      data_span.removeClass('hidden').siblings().addClass('hidden');
      payment_system_currency = $(data_span).data('currency');

      if (button_label.hasClass("ui-state-active")){
        if (price = $(data_span).data('value')){
          total += parseFloat( price );
        }
        if (!( Number(total) === total && total % 1 === 0)){
          total = Math.round(total * 100) / 100;
        }
      }
    });

    format_number = this.numberWithSpaces( total );

    transfer_total_price.html(format_number+' <span class="currency">'+payment_system_currency+'</span>');
    return total;
  },

  choose_transfer: function(choosen_transfer){
    var self = this;
    var this_transfer_item  = $(choosen_transfer).parents(".js-transfer-item")
      , button_label        = this_transfer_item.find(".js-check-transfer-label")
      , transfer_offer      = this_transfer_item.find(".js-want-this-car")
      , right_block         = this_transfer_item.find(".js-right-title")
      , no_extra            = $('.js-additional-service__transfer [for="no-extra-transfers"]');

    if (button_label.hasClass("ui-state-active")) {
      transfer_offer.show();
      right_block.show();
      if(no_extra.attr('aria-pressed') == 'true') no_extra.trigger('click');
    } else {
      transfer_offer.hide();
      right_block.hide();
    }

    $(choosen_transfer).on("change", function(event){
      if (button_label.hasClass("ui-state-active")) {
        transfer_offer.show();
        right_block.show();
        if(no_extra.attr('aria-pressed') == 'true') no_extra.trigger('click');
      } else {
        transfer_offer.hide();
        right_block.hide();
      }
      self.count_transfer_total_cost();
    });
  },

  load_no_extra: function(){
    var transfer_tab = $('.js-additional-service__transfer');
    var no_extra = transfer_tab.find('[name=no-extra-transfers]');
    no_extra.on('change', function(){
      if (transfer_tab.find('[for="no-extra-transfers"]').attr('aria-pressed') == 'true'){
        transfer_tab.find(".js-check-transfer-label.ui-state-active").each(function(){
          $(this).trigger('click');
        });
      }
    });
  },

  numberWithSpaces: function(x){
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
  },

  month_date_time_format: function(departure_date){
    var parsed_date = new Date(Date.parse(departure_date));
    var parsed_day    = ('0' + parsed_date.getDate()).slice(-2);
    var parsed_month  = I18n['months1'][parsed_date.getMonth()];
    var parsed_hour   = ('0' + parsed_date.getHours()).slice(-2);
    var parsed_min    = ('0' + parsed_date.getMinutes()).slice(-2);

    return parsed_day + " " + parsed_month + " " + parsed_hour + ":" + parsed_min;
  },

  reload_transfer_checkboxes: function(){
    var transfer_block = $('.js-additional-service__transfer');
    var checked_elements = transfer_block.find('input[type="radio"].tab_gender_select, input[type="checkbox"].tab_gender_select');
    checked_elements.push($('.popup__content input[type="radio"], .popup__content input[type="checkbox"]'));
    checked_elements.iCheck({
      checkboxClass: 'icheckbox_minimal',
      radioClass:    'iradio_minimal'
    });

    var checked_elements = transfer_block.find('input[type="radio"]:not(.tab_gender_select), input[type="checkbox"]:not(.tab_gender_select)').not($('.popup__content input[type="radio"], .popup__content input[type="checkbox"]'));
    $( checked_elements ).button();

    var self = this;
    $(".js-check-transfer").each(function(){
      self.choose_transfer(this);
    });
  },

  reload_close_button: function(){
    var self = this;
    $(".js-transfer-item .js-transfer-mfp-close").each(function(){
      $(this).on('click', function(){
        self.transfer_close_button(this);
      });
    });
  },

  reload_transfer_input_focusout: function(){
    var self = this;
    $(".js-transfer-item .js-transfer-location").each(function(){
      $(this).on('focusout', function(){
        self.transfer_close_button($(this).parents('.js-right-title').find('.js-transfer-mfp-close'));
      });
    });
  },

  reload_transfer_change_link: function(){
    $(".js-change-transfer-route").each(function(){
      $(this).on('click', function(){
        var info_block = $(this).parents('.js-right-title')
        , input_field = info_block.find('input')
        , right_text = info_block.find('.js-right-text')
        , right_location = info_block.find('.js-right-location')
        , possible_booking_time = info_block.find('.js-possible-booking-time')
        , close_button = info_block.find('.js-transfer-mfp-close');
        input_field.css("width","200px");
        input_field.show();
        close_button.show();
        input_field.focus();
        right_location.hide();
        possible_booking_time.hide();
        $(this).hide();
      });
    });
  },

  transfer_close_button: function(close_button){
    var info_block = $(close_button).parents('.js-right-title')
    , change_link = info_block.find('.js-change-transfer-route')
    , input = info_block.find('input')
    , pbt = info_block.find('.js-possible-booking-time')
    , right_location = info_block.find('.js-right-location');
    $(close_button).hide();
    input.hide();
    change_link.show();
    right_location.show();
    pbt.show();
  },

  load_transfers: function(){
    var request_count = 3;
    var request_timeout = 5000;
    this.send_request( request_count, request_timeout);
  },

  send_request: function(request_count, request_timeout){
    var self = this;
    var transfer_tab = $('.js-additional-services .js-tab-item[data-tab-service-name=transfers]');
    if (!$('.js-additional-transfer__content').length && $('.js-additional-service__transfer').length){
      if(!!transfer_tab.length){
        transfer_tab.off('click');
        transfer_tab.addClass('transfer-unactive-tab');
      }
      var transfer_block = $('.js-additional-service__transfer');
      var data = $.parseParams(window.location.search.replace("?",""));
      self.unactive_tab();
      var timerId = setTimeout(function send() {
        $.ajax({
            url: "transfer_upsale_render_tab_content",
            type: 'post',
            data:  $.param(data),
            dataType: 'json',
            success: function(response){
              if (response.status){
                self.reload_response( transfer_block, response );
                transfer_tab.on('click', self.tab_active_click);
                transfer_tab.removeClass('transfer-unactive-tab');
              }else{
                if(response.resend && request_count > 0){
                  setTimeout( send, request_timeout );
                }else{
                  clearTimeout( timerId );
                  self.unactive_tab();
                }
              }
            }
        });
        request_count--;
      }, request_timeout);
    }else{
      if(!!transfer_tab.length)
        transfer_tab.on('click', self.tab_active_click);
    };
  },

  reload_response: function(transfer_block, response){
    transfer_block.html('');
    transfer_block.append( $(response.content) );

    this.reload_elements();
  },

  tab_active_click: function(ev){
    var currentTarget = ev.currentTarget;
    var curTab = $(currentTarget).attr('data-attr');
    var parents_block = $(currentTarget).parents(".js-tab-block");
    parents_block.find('.js-tab-item').removeClass('active');
    $(currentTarget).addClass('active');
    parents_block.find('.tab-content').removeClass('active');
    parents_block.find('.'+curTab).addClass('active');
  },

  select_time: function(){
    var self = this;
    $('.js-additional-transfer__content [name=possible_booking_time_select]').on('change', function(){
      var changed_time = $(this).val();
      var this_item = $(this).parents('.js-transfer-item');
      this_item.find('.type').find('#transfer_possible_booking_time').val(changed_time);
      this_item.find('.js-possible-booking-time').html(self.month_date_time_format(new Date(changed_time*1000)));
    });
  },

  unactive_tab: function(){
    var transfer_tab = $('.js-additional-services .js-tab-item[data-tab-service-name=transfers]');
    transfer_tab.css('color','gray').css('cursor','default');
  }

});

var TransferService = function(){
  this.initEvents();
}

TransferService.prototype.initEvents = function() {
  this.mainTransferWrapp  = $('.js-additional-service__transfer');
  this.mainWrapp          = this.mainTransferWrapp.find('.js-transfer-offer__item__price');
  this.total_block_text   = this.mainTransferWrapp.find('.js-translations').data('total-block-title');
  this.selfPrice          = 0;
  this.selfOriginalPrice  = 0;
  var self = this;
  this.mainTransferWrapp.find('.js-check-transfer').on('change', function(e) {
    self.reloadPrice();
  });
}

TransferService.prototype.reloadPrice = function() {
    this.reloadCost();
    PriceCalculationObj.reloadPrice();
    this.notify();
  }

TransferService.prototype.reloadCost = function() {
  var services_cost = 0;
  var originalCost  = 0;

  $('.additional_prices_js [id = addP_additional-service-transfers]').remove();
  services_cost = $('.js-additional-service__transfer').controller().count_transfer_total_cost();
  originalCost  = services_cost;

  $('.payment_block').controller().additionalPricesSet('transfers', this.total_block_text, services_cost);

  if (typeof avia_sub_total != 'undefined') {
      avia_sub_total.add_service('transfer_services', [{'label': this.total_block_text, 'price': services_cost}]);
      avia_sub_total.reload();
  }

  this.selfPrice = services_cost;
  this.selfOriginalPrice = originalCost;
}

TransferService.prototype.subscribers = [];
TransferService.prototype.notify = function(){
  var self = this;
  this.subscribers.forEach(function(subscriber){
    subscriber.updateService(self);
  });
};

TransferService.prototype.addSubscriber = function(subscriber){
  if(typeof subscriber.updateService === 'function'){
    this.subscribers.push(subscriber);
  }else{
    console.warn("subscriber doesn't provide updateService method");
  }
};


$(function(){

  var core_enable       = $('.js-additional-service__transfer .js-core-enable').data('coreEnable');
  var transfer_tab      = $('.js-additional-services .js-tab-item[data-tab-service-name=transfers]');
  var transfer_content  = $('.js-additional-service__transfer').parent();

  if(core_enable == 1){
    transferServiceObj = new TransferService;
    PriceCalculationObj.addService(transferServiceObj);
    if(!!transfer_tab.length){
      transfer_tab.off('click');
      $('.js-additional-service__transfer').controller().load_transfers();
    }
  }else{
    transfer_tab.remove();
    transfer_content.remove();
    if($('.js-page-need-separate').length == 0){
      if(!($('.js-additional-services .js-tab-item:visible').size() > 0)) $('.js-additional-services').addClass('hidden');
      if(($('.js-additional-services .js-tab-item:visible').size() == 1)) $('.js-off-single-tab').addClass('hidden');
    }else{
      if($('.js-additional-services .js-tab-item:not(.hidden)').length <= 1) $('.js-additional-services .js-tab-wrapper').addClass('hidden');
      else $('.js-additional-services .js-tab-wrapper').removeClass('hidden');
    }
  }
});
