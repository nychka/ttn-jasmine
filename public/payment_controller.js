$.Controller("PaymentController",{
  bubbling: false,
  next_unfilled_input_container: false,
  init:function(){
    this.setup_mask();
    //this.init_fancybox_tips();
    this.clear_form();
    this.timer = this.element.find(".timer_js").not("#credit_timer");
    this.cardholder_specials = $('#card_holder').data('specials');
    this.check_factura_vat();
    this.without_real_payment =  Number(this.element.data("without-real-payment"))
    this.credit_timer = this.element.find("#credit_timer");
    this.promocode_value = "";
    this.additionalPrices = {};
    $('#credit_signing_repeat_button').on("click",  function() {
      credit.credit_send_sms_code();
    });
    $('#credit_signing_confirmation_button').on("click",  function() {
      credit.ConfirmationOfCodeCredit();
    });
    $(".valid_credit_passport_number").mask("?99 - 99 - 999999");
    $('.payment-links').on("click",function(ev){
      ev.preventDefault();
      var el = ev.target;
      var selected_group_name = $(el).data('payGroup');
      $.magnificPopup.close();
      $('#payment_way_tabs').find('[data-pay_group="'+selected_group_name+'"]').click();
    });

    credit_interval="";

    window.domain = this.get_base_host();
    var active_pay_group = $('.way_name_row.active').find('[name=pay_group]');

    if(this.timer.size() && $('.watch').html()){
      this.timer_start();
    }
    active_pay_group.change();

    if ($('.active_group_block .my_cards_list li').length > 5) {
      $('.save_card_data').slideUp();
    };
    $('.payment_group_errors .ps_reason').live('click', function() {
      $('.payment_group_errors .ps_reason_description').slideToggle();
    });
    if(window['front_version'] == 'mobile'){
      $('[name=radio-extra-4]').on('change',this.change_payment_system);
      $('input').attr('disabled', false);
    }else if( window['front_version'] == 'v2'){
      var self = this;
      $('.payment_tab').on('click',function(ev){
        var curTab = $(this).attr('data-attr');
        var parents_block = $(this).parents(".js-tab-block");
        parents_block.find('.payment_tab').removeClass('active');
        $(this).addClass('active');
        self.change_payment_system(ev);
      });
    }else{
      var tabsContainer =  $('#payment_way_tabs');
      var activeTabIndex = this.getActiveTabIndex(tabsContainer);
      tabsContainer.tabs({active: activeTabIndex});
      tabsContainer.on("tabsactivate", this.change_payment_system);
    }
    this.init_legal_person_block();

    this.paymentScroll();
    /**
    * Реєструємо поля для синхронізації даних введених користувачем
    * @jira PS-5
    */
    var card_wrapper = $('.card_data');
    if(card_wrapper.length == 1) this.removeCardOwnerForEventsService(card_wrapper);
    if(card_wrapper.length > 1) {
      var self = this;

      this.cardInputSubject = new CardData();
      card_wrapper.find('input').each(function(i, item){
        self.cardInputSubject.registerObserver($(item));
      });
    }

    if ($('.way_name_row_aircompany.was_direct').length > 1) {
      $('.way_name_row_aircompany.was_direct').not(":first").hide();
    };
    if ($('.way_name_row_aircompany.was_aircompany.active').length) {
      $('.aircompany_change_currency').hide();
    };
    if($(".aircompany_change_currency .select").length && $(".card_data:visible").length){
      $(".aircompany_change_currency .select").css("top", $(".card_data:visible").position().top+198);
    }
    this.switch_card_types();
    if ($('p.price strong.price') && this.get_active_tab()) {
        $('p.price strong.price').text(this.get_active_tab().find('span').text());
    }
    $("#pay_button_disable").live("click", function() {
      return false;
    });
    // DEBUG START
    var self = this;
    this.cost = new Cost(); // modules/payment/cost.js
    if(typeof PriceCalculationObj === 'object'){
       this.cost.setCalculationService(PriceCalculationObj);
    }
    this.cost.init({ fn: self.afterCostInitializing, scope: self });
    this.useMaestroMomentum();
    this.bind_copy_card_data();
    // DEBUG END
  },
  /**
  * @jira PS-1476
  *
  */
  useMaestroMomentum: function(){
    var storage = this.cost.getClientStorage();

    if(storage && storage.configs && storage.configs.use_maestro_momentum){
     this.payment_card = new PaymentCard();
     this.payment_card.init();
    }
  },
  /**
  * @jira PS-1391
  * NOTICE: This should be in events_controller.js isn't it?
  */
  removeCardOwnerForEventsService: function(card_wrapper){
      var service = $('.way_th').data('current-service');
      if(service === 'events'){
        try{
          var form = $('form:first'),
              card_holder = form.find('[name=card_holder]'),
              card_holder_value = "Cardholder";

          if(form && form.length && card_holder && card_holder.length){
            card_holder.val(card_holder_value);
            card_wrapper.find('.card_owner').hide();
          }else{
            console.warn("Cardholder wasn't found! Check if $('form:first').find('[name='card_holder']) is working");
          }
        }catch(err){
          console.warn("Card owner have to be removed from Events service according to task but its gone! Very strange...");
        }
      }
  },
  switch_factura_vat:function(){
    if($('#individual').attr("checked")) {
      $('.firm').hide();
      $('.firm').find('input').attr('disabled', 'disabled');
      $('.individual').show();
      $('.individual').find('input').attr('disabled', false);
    } else if ($('#firm').attr("checked")) {
      $('.individual').hide();
      $('.individual').find('input').attr('disabled', 'disabled');
      $('.firm').show();
      $('.firm').find('input').attr('disabled', false);
    } else {
      $('.user-data').hide();
      $(".user-data").find('input').attr('disabled', 'disabled');
    }
  },
  check_factura_vat:function(){
    if($(".factura_vat").length){
      if($('.way_name_row_aircompany.active[data-default_group=aircompany]').is(':visible')){
        $(".factura_vat").slideUp();
        $(".user-data").find('input').attr('disabled', 'disabled');
      }else{
        $(".factura_vat").slideDown();
        this.switch_factura_vat();
      }
    }
  },
  // TERMINALS CHANGE
  terminals_change:function(value){
    active_row = $('.way_name_row.active');
    if(!value){
      value = active_row.data('change-class');
    }
    if(value){
      if( active_row.data('payment-type') == "terminals" ){
        if ($("input[name=terminal_paysystem]:checked").length){
          var ps_val = $("input[name=terminal_paysystem]:checked").val();
          $("input.terminal_paysystem[name=paysystem]").val(ps_val);
        }
        $(".payment-box.terminals_ul .pay-method").removeClass('active').find("[data-id="+value+"]");
        $(".payment-box.terminals_ul .pay-method[data-id="+value+"]").addClass('active');
        active_row.removeClass('terminals'+active_row.data('change-class')).addClass('terminals'+value).data('change-class', value);
        var ps_info = $("input.terminals_card.payment_system[data-payment_system_id="+value+"]");
        var puts = function(item, data){
          if(window['front_version'] == 'mobile'){
            item.text(data);
          }else{
            item.find('strong').text(data);
          }
        };
        var full_data = ps_info.data('params').body;
        active_row.find('[data-payment-data]').each(function(i, item){
          var item = $(item),
              type = item.data('payment-data'),
              data = full_data[type];

          if(data)puts(item, data);
        });
        topay = ps_info.data('params').body.topay;
        active_row.data('payment_system_id', value);
        active_row.data('cost', topay);
        this.cost.reloadBonuses();
        this.cost.reloadPrice();
      }
      if($(".external_order[data-id="+value+"]").length){
        $(".external_order").hide();
        $(".external_order[data-id="+value+"]").show();
        $('#pay_button').attr('id', 'pay_button_disable').parent('.cost').hide();
      }else{
        $(".external_order").hide();
        $('#pay_button_disable').attr('id', 'pay_button').parent('.cost').show();
      }
    }
  },
  ".terminals_ul input[type=radio] -> change": function(ev) {
    this.terminals_change($(ev.target).val());
  },
  // end TERMINALS CHANGE
  afterCostInitializing: function(){
    var home_self = this;
    this.setup_magnific_inline();
    this.change_currency_for_payment_card();
    if(this.cost.hasPaymentSystems()){
      if( window['front_version'] == 'v2'){
        var self = this;
        setTimeout(function(){
          var tabsContainer =  $('#payment_way_tabs');
          var activeTabIndex = self.getActiveTabIndex(tabsContainer);
          tabsContainer.find('[data-slick-index='+activeTabIndex+']').addClass('active');
          if(window['front_version'] != "mobile"){
            $('.payment_block').iCheck('destroy');
            if($('.no-ui-customization').length > 0){
              $('.no-ui-customization').button('destroy');
            }
            var checked_elements = $('.card-type-list.markups_js input[type="radio"]');
            checked_elements.iCheck({
              checkboxClass: 'icheckbox_minimal',
              radioClass:    'iradio_minimal'
            });
          }
          $('.label_class, .card-type-list__item .iradio_minimal .iCheck-helper').on('click', function(ev) {
            home_self.shared_select_markup_card(ev);
          });
          if(window['front_version'] != "mobile"){
            var checked_elements = $('.payment_block').find('input[type="radio"], input[type="checkbox"]').not($('.popup__content input[type="radio"], .popup__content input[type="checkbox"], .card-type-list.markups_js [type="radio"], .no-ui-customization'));
            $( checked_elements ).button().button( "option", "disabled", false );
          }
          if($('.payment_tab.active').data('pay_group') == "cash_map"){ cash_map.run();}
        },200);
      }
      this.cost.toggleUseBonuses();
      this.cost.reloadPrice();
      this.cost.reloadBonuses();
      this.define_paysystem();
      this.check_direct_as_service();
      this.terminals_change(false);

      this.cost.reload();
      //@jira PS-1532
      this.cost.hideCalculationBlock();
      if($('#use_usblp_bonuses[data-card_used="true"]').length > 0){
        this.loadUsblpBonusesSelector(true);
        $('.js_usblp_bonuses .your-choise').remove();
        $('#direct_bonus').remove();
        $('.payment_tab').each(function(i, cur_tab ){
          if(!$(cur_tab).hasClass('ui-tabs-active') && !$(cur_tab).hasClass('active')) $(cur_tab).hide();
        });

      }else if($('.js_usblp_bonuses').length > 0){
        if($('.way_name_row_aircompany.active').data('default_group') == 'aircompany'){
          setTimeout( "$('[name=use_usblp_bonuses]').iCheck('uncheck')", 100);
          this.cost.setUsblpUseBonusesCheck(false);
          this.loadUsblpBonusesSelector(false);
          $('.js_usblp_bonuses').hide();
        }else{
          $('.js_usblp_bonuses').show();
        }
      }
      this.load_default_markup_prices();
    }
    if ($('select[name=aircompany_change_currency][data-referer_default_currency]').length) {
      referer_currency = $('select[name=aircompany_change_currency]').data('referer_default_currency');
      if ($('.way_name_row_aircompany.was_direct[data-currency=' + referer_currency + ']').length) {
        var referer_currency_row_id = $('.way_name_row_aircompany.was_direct[data-currency=' + referer_currency + ']').attr('id');
        if(window['front_version'] == 'v2'){
          $('.card-currency:visible .currency_select_js').val(referer_currency_row_id).change();
        }else{
          if ($('a[rel=' + referer_currency_row_id + ']').length) {
            $('a[rel=' + referer_currency_row_id + ']').click();
          }
        }
      }
    }
    $('#payment_way_tabs').find('.js_tab_display').click();
    if (window.credit_payment_active_tab != undefined && window.credit_payment_active_tab != false ){
      setTimeout(function(){
        var el = window['front_version'] == 'v2' ? "" : " a";
        var a_tab = $(".payment_tab"+el+"[data-payment_system_id="+window.credit_payment_active_tab +"]");
        a_tab.click();
        $('.payment-nav.js-slick-responsive').slick('slickGoTo', a_tab.data("slickIndex"), false);
      },200);
    }

    // $.each(this.cost.getPaymentSystems(), function(index, ps) {
    //     if(ps.getGroupName() == 'credit'){
    //       var status_credit = $('#status_credit_'+ps.id).val();
    //       $('.credit_'+ps.id).children().hide();
    //       if(status_credit){
    //         $(".credit_"+status_credit+"_"+ps.id).show();
    //       }else{
    //         $(".credit_IAC_"+ps.id).show();
    //       }
    //     }
    // });
    window.onmessage = function(event) {
      if (event.data === "reload") {
        location.reload();
      }
    };
    // if( window['front_version'] == 'mobile'){
    //   // if($('.payment_tab').length < 2 && (this.cost.getCalculationService() == undefined || this.cost.getCalculationService().calculationServices.length < 1)){
    //     // payment_step(2);
    //   // }
    // }
  },
  define_active_payment_system: function(){
    var paymentSystem = this.cost.getActivePaymentSystem();
    if(paymentSystem){
      var id = paymentSystem.getId();
      $('[name=paysystem][value='+id+']').attr('disabled', false);
    }
  },
  "#credit_WRC_button -> click": function(ev){
    var data = $( "form" ).serialize()

    RequestForApprovalOfAgreementCredit(data)
    ev.preventDefault();
    var el = $(ev.target).parent();
  },
  credit_timer_start:function(){
    var self = this;
    this.parent.credit_diff = self.credit_timer.data("diff");
    $('#credit_watch').show();
    clearInterval(self.credit_interval);
    self.credit_interval = setInterval(
      function(){
        var credit_date =  gmdate('i:s',self.parent.credit_diff).split(":");

        self.credit_timer.find(".digits:eq(0)").text(credit_date[0]);
        self.credit_timer.find(".digits:eq(1)").text(credit_date[1]);
        self.parent.credit_diff--;
        if(!Number(credit_date[0]) && !Number(credit_date[1])){
          $('#credit_watch').hide();
          clearInterval(self.credit_interval);
          $("#sms_code").prop( "disabled", true );
          $("#credit_signing_repeat_button").show();
          credit.show_error("timeout_confirm_sms");
          return true;
        }
      }
      ,1000);
  },

  "[name=use_user_bonuses] -> change": function(ev){
    var checked = !$(ev.target.parentElement).hasClass('checked'),
        checkboxes = $('[name=use_user_bonuses]').not(ev.currentTarget);
    $(ev.target).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');

    if(window['front_version'] == 'v2'){
      checked = $(ev.target).attr('checked');
      checkboxes.each(function(i, cur_cbox ){
        if(checked){
          $(cur_cbox).attr('checked', true);
        }else{
          $(cur_cbox).removeAttr('checked');
        }
        $(cur_cbox).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
      });
    } else if(window['front_version'] == 'mobile'){
      checked = $(ev.target).prop('checked');
      checkboxes.each(function(i, cur_cbox ){
        if(checked){
          $(cur_cbox).attr('checked', true).parent().find('.ui-checkbox-off').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
        }else{
          $(cur_cbox).removeAttr('checked').parent().find('.ui-checkbox-on').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
        }
        $(cur_cbox).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
      });
    } else {
      checkboxes.each(function(i, cur_cbox ){
        checked ? $(cur_cbox).iCheck('check') : $(cur_cbox).iCheck('uncheck');
        $(cur_cbox).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
      });
    }
    // if( checked && this.cost.useUsblpBonusesChecked() ){
    //   if(window['front_version'] == 'v2') {
    //     $('.js_use_bonuses_check:visible label').removeClass('ui-state-active');
    //     $('.js_use_bonuses_check:visible input').removeAttr('checked');
    //   } else if(window['front_version'] == 'mobile'){
    //     $('[name=use_usblp_bonuses]').prop('checked',false).parent().find('.ui-checkbox-on').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
    //   } else {
    //     setTimeout( "$('[name=use_usblp_bonuses]').iCheck('uncheck')", 100);
    //   }
    //   this.cost.setUsblpUseBonusesCheck(false);
    //   this.loadUsblpBonusesSelector(false);
    // }
    this.cost.setUseBonusesCheck(checked);
  },
  "[name=use_usblp_bonuses] -> change": function(ev){ // USBLP CHECKBOX
    var checked = !$(ev.target.parentElement).hasClass('checked');
    if(window['front_version'] == 'mobile'){
      checked = $(ev.target).prop('checked');
    }
    else if(window['front_version'] == 'v2'){
      checked = $('[name=use_usblp_bonuses]:enabled').is(":checked");
    }
    // disable tickets program
    this.loadUsblpBonusesSelector(checked);
    // if( checked && this.cost.useBonusesChecked() ){
    //   var checkboxes = $('[name=use_user_bonuses]');
    //   if(window['front_version'] == 'v2'){
    //     checkboxes.each(function(i, cur_cbox ){
    //       $(cur_cbox).removeAttr('checked');
    //     });
    //   } else if(window['front_version'] == 'mobile'){
    //     checkboxes.each(function(i, cur_cbox ){
    //       $(cur_cbox).removeAttr('checked').parent().find('.ui-checkbox-on').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
    //     });
    //   } else {
    //     checkboxes.iCheck('uncheck');
    //   }
    //   this.cost.setUseBonusesCheck(false);
    // }
    $(ev.target).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
    this.cost.setUsblpUseBonusesCheck(checked);
    //msg when user check bonuses
    if(this.get_active_tab().data('pay_group') != 'direct' && checked){
      text = this.element.find('.add_bonus_desc:first').text();
      if(text){
        message('msg_title', text, 'continue_button', window.close_message);
      }
    }
  },
  /**
  USBLP on/off
   - hiding/showing payment tabs
   - fiilling/clearing card data
  **/
  setInterfaceForUsblpUse: function(status){
    var card_el = this.element.find(".card_data:visible");
    card_el.find('#card_number_2').val('').trigger('blur.usbl');
    card_el.find('#card_date_month').val('').trigger('blur.usbl');
    card_el.find('#card_date_year').val('').trigger('blur.usbl');
    card_el.find('#card_holder').val('').trigger('blur.usbl');
    card_el.find('#card_cvv').val('').trigger('blur.usbl');
    if(status){
      if( $('.payment_tab').length == 1 &&  !$('.payment_tab').hasClass('active') ){
           $('.payment_tab').addClass('active'); // if there is only one tab, make it active, because it is shown anyway
      }
      $('.payment_tab').each(function(i, cur_tab ){
        if(window['front_version'] == 'v2'){
          if(!$(cur_tab).hasClass('active')) $(cur_tab).hide();
        } else if(window['front_version'] == 'mobile'){
          if(!$(cur_tab).find('input').prop('checked')) $(cur_tab).hide();
        } else {
          if(!$(cur_tab).hasClass('ui-tabs-active')) $(cur_tab).hide();
        }
      });
      if(window['front_version'] != 'mobile'){
        $('.pay_aircompany_type').hide();
        $('.service_package').hide();
      } else {
        $('.payment_options').hide();
      }
      card_el.find('#card_number_0').val($('#usbl_selector').val().substr(0,4)).prop('readonly',true).focus();
      card_el.find('#card_number_3').val($('#usbl_selector').val().substr(4,4)).prop('readonly',true).focus();
      card_el.find('#card_number_1').val('').trigger('blur.usbl');
    }else{
      if(window['front_version'] != 'mobile'){
        $('.pay_aircompany_type').show();
        $('.service_package').show();
      } else {
        $('.payment_options').show();
      }
      $('.payment_tab').show();
      card_el.find('#card_number_1').val('').trigger('blur.usbl');
      card_el.find('#card_number_3').val('').prop('readonly',false).trigger('blur.usbl');
      card_el.find('#card_number_0').val('').prop('readonly',false).trigger('blur.usbl');
    }
  },
  /**
  USBLP card selector loading
  */
  loadUsblpBonusesSelector: function(status){
    var paymentSystem = this.cost.getActivePaymentSystem();
    if(window['front_version'] != 'mobile'){
      var cards = $('#use_usblp_bonuses').attr('data-card_numbers');
      if(cards != undefined){
        if(status){
          if($('#usbl_selector').length > 0){
            $('#usbl_selector').selectbox("detach").remove();
          }
          cards = cards.split(',');
          var USBLP_Select = $('<select></select>', {id: 'usbl_selector' , class:"chosen-select-no-search ignore-selectbox"});
          $('#usb_selector_block_'+paymentSystem.getId()).append(USBLP_Select);
          var option = '';
          var text = '';
          for(var i = 0;i < cards.length;i++){
            text = cards[i].substr(0,4)+" "+cards[i].substr(4,2)+"XX XXXX "+cards[i].substr(6,4);
            option = $('<option></option>', {value: cards[i].substr(0,4)+cards[i].substr(6,4), text: text});
            USBLP_Select.append(option);
          }
          $('#usbl_selector').chosen({
            disable_search_threshold: true
          })
          var self = this;
          USBLP_Select.on('change',function(val){
            self.setInterfaceForUsblpUse(true);
          });
          $('#usb_cards_block_'+paymentSystem.getId()).show();
          this.setInterfaceForUsblpUse(true);
        }else{
          $('.usb_cards_block').hide();
          $('#usbl_selector').selectbox("detach").remove();
          if( this.element.find('#usbl_selector_chosen').length > 0   ){
            this.element.find('#usbl_selector_chosen').remove();
          }
          this.setInterfaceForUsblpUse(false);
        }
      }
    } else if($('#can_use_usblp_bonuses').length > 0) {
      this.setInterfaceForUsblpUse(status);
    }
  },
  "#usbl_selector -> change": function(ev){ // otp dropdown
    this.setInterfaceForUsblpUse($('[name=use_usblp_bonuses]:enabled').prop("checked"));
  },
  /**
  * for fake payment systems
  *  - resets active payment system id
  *  - sets 'visa_debit' as active payment system group
  * for real payment systems:
  *  - restores real payment system id and group
  */
  set_fake_payment_system_and_group: function(){
    if($('.select_select.payment_markups:visible').length == 0) return false;
    if($('.select_card_type:visible').length > 0){
      var select = $('.select_card_type:visible');
      var selected = select.find('option:selected');
      var is_fake = selected.data('is_fake');
      $('input[name=markup_rule_id]').val(selected.data('rule_id'));
      $('input[name=markup_card_name]').val(selected.data('card_name'));
    }else{
      var is_fake = $('.markup_card_type:checked:visible').data('is_fake');
      $('input[name=markup_rule_id]').val($('.markup_card_type:checked:visible').data('rule_id'));
      $('input[name=markup_card_name]').val($('.markup_card_type:checked:visible').data('card_name'));
    }
    var paygroup = $('[name=pay_group]');
    var paysystem = $('[name=paysystem]:enabled');
    if(is_fake){
      paygroup.val("visa_debit");
      paysystem.val("10100");
    }else{
      this.restore_payment_system_and_group();
    }
    this.reload_direct_as_service();
    return is_fake;
  },
  /**
  * restores current payment system id and group name into form
  */
  restore_payment_system_and_group: function(){
    var paygroup = $('[name=pay_group]');
    var paysystem = $('[name=paysystem]:enabled');
    var active_tab = this.get_active_tab();
    var active_row = this.get_active_payment_row();
    var original_paygroup = active_tab.data('pay_group');
    var original_paysystem = active_row.data('payment_system_id');

    paygroup.val(original_paygroup);
    paysystem.val(original_paysystem);
  },
  /**
  * Вибір типів карт (VISA, MAESTRO) якщо вони доступні для плат.систем
  */
  load_default_markup_prices: function(){
    if($('.select_select.payment_markups:visible').length > 0){
      var self = this;
      self.set_fake_payment_system_and_group();
      var inactive = $('.way_name_row_aircompany:visible').not('.active');
      $(inactive).each(function(){
        var system_id = $(this).data('payment_system_id');
        var paymentSystem = self.cost.findPaymentSystemById(system_id);
        var num = $(this).attr('data-cost').replace(/\s/, '');
        cost = (parseFloat(num) + parseFloat(self.cost.getMarkupBonus(system_id)));
        $(this).data('cost', cost);
        if(paymentSystem.isCurrencyEquals(self.cost.getDefaultCurrency())){
          cost = self.cost.formatNumber(cost, paymentSystem.getCurrency());
        }else{
          cost = self.cost.formatNumber(cost, this.getDecimalPrecisionOtherCurrency());
        }
        $(this).find('strong').html(cost + " " + $(this).data('currency'));
      });
    }
  },
  select_markup_card: function(val){
    var self = this;
    var active_row = self.get_active_payment_row();
    var active_payment_system_id = active_row.data('payment_system_id');
    var num = active_row.attr('data-cost').replace(/\s/, '');
    var original_cost = parseFloat(num);
    cost = (original_cost + parseFloat(val));
    active_row.data('cost', cost);
    self.set_price();
    self.set_fake_payment_system_and_group();
    self.cost.reload();
  },
  ".markup_card_type -> change":function(ev){
    this.shared_select_markup_card(ev);
  },
  shared_select_markup_card: function(ev){
    $('.markups_js').find('samp').remove();
    var self = this;
    var val = ev.target.value;
    $('.iradio_minimal.error').removeClass('error');
    $('.markup_error_js:visible').hide();
    setTimeout( function(){
      self.select_markup_card(val);
    }, 100);
  },
  "select.markups_js -> change":function(ev){
    this.select_markup_card(this.cost.getMarkupBonus());
  },
  switch_card_types: function(){
    var self = this;
    var select_card_type = $('.select_card_type');
    if(select_card_type.length == 0) return false;

    select_card_type.each(function(i){
      var selectbox = $(this);
      var select = selectbox.find('select');
      if(select.selectbox == undefined) return false;
      select.selectbox('detach');
      select.selectbox({
        onChange: function(val){
          self.select_markup_card(val);
        }
      });
      select.selectbox('attach');
    });
  },
  //OPTIMIZE: replace to Cost
  get_active_payment_row: function(){
    var aircompany = $('.way_name_row_aircompany.active');
    return (aircompany.length) ? aircompany : $('.way_name_row.active');
  },
  init_legal_person_block: function() {
    var active_payment_group = $('[name=pay_group]').val();
    if (active_payment_group == 'bank_for_lpp') {
      var unique_id = $('[data-pay_group="bank_for_lpp"]').data('payment_system_unique_id');
      this.prepare_legal_person_block( $('#'+unique_id+'_block') );
    }
  },
  get_base_host: function(){
    var regex = new RegExp(window.cur_domain+".", "i");
    var domain = location.host.replace(regex, "");
    return domain;
  },
  //OPTIMIZE: code duplication
  getActiveTabIndex: function(tabsContainer){
    var active_payment_group = $('[name=pay_group]').val();

    var result = tabsContainer.find('[data-pay_group='+active_payment_group+']');
    if(result.length > 1){
      return $(result[0]).attr('data-slick-index');
    }else if(result.length == 1){
      return $(result).attr('data-slick-index');
    }
    return 0;
  },
  "#savecard -> change":function(ev){
    if($('.save_card_data .icheckbox_minimal').hasClass('checked')){$(ev.target).val("");}else{$(ev.target).val("1");}
  },
  ".paym_card -> click":function(ev){
    ev.preventDefault();
    if($('.card_data').length > 1) {
      this.cardInputSubject.stopNotification();
    }
    var el = $(ev.target).parent();
    el.parent().siblings().removeClass("active");
    el.parent().addClass("active");
    $('.card_data input').val('');
    var card_el = this.element.find(".card_data:visible");
    var card_data = el.data("card");
    card_el.find("#card_date_month, #card_date_year").val("XX").prop('type', 'password').focus();
    var first_four = card_data.pan6.slice(0,4);
    var last_four = card_data.pan4;
    card_el.find("#card_number_0").val(first_four).focus();
    card_el.find("#card_number_3").val(last_four).focus();
    card_el.find("#card_number_1, #card_number_2").val("XXXX").prop('type', 'password').focus();
    card_el.find("#card_holder").val("XXXXXXXXXXXXXXXXXXXXXXXX").prop('type', 'password').focus();
    card_el.find("#card_cvv").val("").focus();
    this.element.find(".card_data:visible input:not(#card_cvv)").prop('disabled', true);
    this.element.find("#save_card_id").val(card_data.id);
    $('.save_card_data').slideUp();
    $('.save_card_data .icheckbox_minimal').removeClass('checked');
    $('.save_card_data #savecard').removeAttr('checked');
    $('.save_card_data #savecard').val("");
  },
  "#card_cvv -> focus":function(ev){
     if(!$.trim($(ev.target).val()).length){
      $(ev.target).caret(0);
    }
  },
  "#card_cvv -> click":function(ev){
    if(!$.trim($(ev.target).val()).length){
      $(ev.target).caret(0);
    }
  },
  ".other_card -> click":function(ev){
    ev.preventDefault();
    // this.cardInputSubject.resumeNotification();
    $(ev.target).parent().siblings().removeClass("active");
    $(ev.target).closest('li').addClass("active");
    if(this.element.find("#save_card_id").val()){
      this.element.find(".card_data:visible input:not(#card_cvv)").each(function(){$(this).val("").prop('disabled', false).prop('type', 'text').focus();$(this).removeClass("error")});
      this.element.find("#save_card_id").val("");
    }
    this.element.find(".card_data:visible #card_number_0").focus();
    if ($('.active_group_block .my_cards_list li').length < 6) {
      $('.save_card_data').slideDown();
    };
  },

  "input[type=text], input[type=tel] -> change": function(ev) {
    if(window['front_version'] != 'v2'){
      if(!this.parent.bubbling) this.next_unfilled_input($(ev.target).attr('id'));
    }
  },
  ".card_num input -> keyup":function(ev){
    var $target = $(ev.target);

    if($target.val().length == 4){
      this.parent.next_unfilled_input_container = $('.card_num');
      this.next_unfilled_input();
    }
  },
  ".card_num input -> click":function(ev){
    var $target = $(ev.target);
    var t_parent = $target.parent();
    if(window['front_version'] == "mobile") t_parent = t_parent.parent();
    var t_id = ev.target.id.substr(12,13);
    if(t_id > 0){
      for(var i = 0; i < t_id; i++){
        if(t_parent.find("#card_number_"+i).val().length < 4){
          t_parent.find("#card_number_"+i).focus();
          break;
        }
      }
    }
    if(window['front_version'] == 'v2' && window['front_version'] != 'mobile' && $target.val().length > 0)
      ev.target.select();
      $target.parents('.card-num-wrapper').removeClass('error');
  },
  ".card_date input -> keyup":function(ev){
    var $target = $(ev.target);

    if (ev.keyCode === 37 || ev.keyCode === 8){
      $target.val("");
      ev.preventDefault();
    }

    if($target.val().length == 2){
      if(window['front_version'] == 'v2' && ev.target.id == "card_date_year"){//&& window.cur_domain != 'my'
        ev.preventDefault();
        setTimeout(function(){$('#card_cvv:enabled').focus()},100);
      }else{
        this.parent.next_unfilled_input_container = $('.card_date');
        this.next_unfilled_input();
      }
    }
  },
  ".card_date input -> click":function(ev){
      ev.target.select();
  },
  ".card_cvv input -> keyup":function(ev){
    var $target = $(ev.target);

    if (ev.keyCode === 37 || ev.keyCode === 8 || ev.keyCode === 46){
      $target.val("");
      ev.preventDefault();
    }
    if(window['front_version'] == 'v2' && $target.val().length == 3){
      setTimeout(function(){$('#card_holder:enabled').focus()},100);
    }
  },
  ".card_cvv input -> click":function(ev){
    ev.target.select();
  },
  ".only_latin_specials_js -> keyup":function(ev){
    var el  = $(ev.target)
    var reg1 = "[^a-zA-Z";
    var reg2 = "\\s\\-]+";
    this.valid_element(el,this.cardholder_specials,reg1,reg2);
  },
  ".only_cyrillic_specials_js -> keyup":function(ev){
    var el  = $(ev.target)
    var reg1 = "[^а-яА-ЯёЁ";
    var reg2 = "\\s\\-]+";
    this.valid_element(el,"",reg1,reg2);
  },
  valid_element:function(el,specials,reg1,reg2){
    var regExp = new RegExp(reg1 + specials + reg2);
    var caretPosition = el.caret().begin - (regExp.test(el.val()) ? 1 : 0);
    var val = el.val().replace(regExp, "").split(" ")

    val.length > 2 ? val.pop() : false;
    el.val(val.join(" "))
    el.caret(caretPosition);
  },
  ".js-promocode-input -> keyup": function(ev){
    this.check_promocode_value($(ev.target));
  },
  "[name=use_promocode] -> change": function(ev){
    var checked = $(ev.target).attr('checked'),
        checkboxes = $('[name=use_promocode]').not(ev.currentTarget);
    $('[name=promotion_code]').val("").removeClass('error');
    $('[name=promotion_code]').closest('.js-section-additional').find('span.promocode-valid, span.error--promocode, .js-clear').remove();

    $("#addP_promocodes").hide();
    $(ev.target).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
    this.promocode_value = "";
    var promoTextInput = $(ev.target).closest('.section-promocode').find('.js-promocode-input');
    this.check_promocode_value(promoTextInput);

    checkboxes.each(function(i, cur_cbox){
      $(cur_cbox).closest('.js-section-additional').toggleClass('active').siblings().toggleClass('disabled');
      if(window['front_version'] == 'v2'){
        checked ? $(cur_cbox).attr('checked', true) : $(cur_cbox).removeAttr('checked');
      } else if(window['front_version'] == 'mobile'){
        checked = $(ev.target).prop('checked');
        if(checked){
          $(cur_cbox).attr('checked', true).parent().find('.ui-checkbox-off').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
        }else{
          $(cur_cbox).removeAttr('checked').parent().find('.ui-checkbox-on').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
        }
      } else {
        checked ? checkboxes.iCheck('check') : checkboxes.iCheck('uncheck');
      }
    });
  },
  rm_tooltip:function(el){
    var idx = $(".txtinput").index(el);
    window.hide_error_popup(idx);
  },
  set_tooltip:function(el,text,scroll){
    //if($('.b_errors').is(':visible')) return false;
    scroll = scroll || false;
    var idx  = $(".txtinput").index(el);
    var self = this;
    el =  el.hasClass("i_accept_chk") ? el.parents(".i_accept") : el;
    if(!$("._idx_" + idx).size())
      window.show_error_popup(el,text,idx,true);
    if($(".error").length > 0){

      if($(".error:eq(0)").is(':visible')){
        wrapper_error_input = $(".error:eq(0)");
      } else {
        wrapper_error_input = $(".error:eq(0)").parent();
      }

      var first_error = $(wrapper_error_input).offset().top - ($(wrapper_error_input).height() * 3);

      if(!idx && ! this.go_top || scroll && !this.go_top) {
        $('html, body').animate({ scrollTop: first_error }, 500,function(){self.go_to_top(false);});
      }
    }
  },
  setup_mask:function(){
    //this.element.find("#card_date").mask("99/99",{placeholder:" ", completed:this.next_unfilled_input});
    this.parent.next_unfilled_input_container = $('.card_owner');
    //this.element.find("#card_cvv").mask("999");
    // this.element.find('input').bind("paste",function(e) {
    //   e.preventDefault();
    // });
    // this.element.find(".card_cvv input").mask('999',{placeholder:"", completed:this.next_unfilled_input})

  },
  // ******************************
  // aircompany change currency start
  // ******************************
  check_visa_dedit_active:function(){
    if($(".service_package").length){
      if($('.way_name_row_aircompany.was_aircompany.active[data-default_group=visa_debit]').length){
        $(".service_package").hide();
      }else{
        $(".service_package").show();
      }
    }
  },
  reload_direct_as_service:function(currency,price){
    if($("#direct_as_service").length){
      if($('.select_select.payment_markups:visible').length){
        currency = this.get_active_payment_row().attr('data-currency_code');
        price = $('.way_name_row_aircompany.was_direct[data-currency=' + currency + ']').data('topay');
        var m_rules = $('#markups_' + $('.way_name_row_aircompany.was_direct[data-currency=' + currency + ']').data('payment_system_id') ).data('payment_markups');
        var ac_price = $('#direct_as_service').data('aircompany_prices')[currency];
        var ac_m_prices = $('#direct_as_service').data('aircompany_markups')[currency];
        var cur_rule = $('.markup_card_type:checked:visible').data('rule_id');
        var cur_value = $('.markup_card_type:checked:visible').val();
        price = price - ac_price;
        if(cur_rule == undefined){
          if(m_rules != undefined){
            cur_rule = m_rules[0].rule_id;
            $(m_rules).each(function(){
              if(this.display){
               cur_rule = this.rule_id;
              }
            });
          }
        }
        if(cur_rule != undefined){
          if(m_rules != undefined){
            $(m_rules).each(function(){
              if(this.rule_id == cur_rule){
               cur_value = this.old_markup;
              }
            });
          }
          for(var i=0;i<ac_m_prices.length;i++){
            if(ac_m_prices[i].rule_id == cur_rule){
              price = price + (cur_value - ac_m_prices[i].payment_markup);
            }
          }
        }
      }
      $('.direct_as_service strong').text('+' + parseFloat(price).toFixed(this.cost.getDecimalPrecision(currency)) + ' ' + currency);
      $('#direct_as_service').data('last_currency', currency);
    }
  },
  check_direct_as_service:function(){
    if($("#direct_as_service").length){
      if($('.way_name_row_aircompany.was_direct.active').length){
        if(window['front_version'] == 'v2'){
          $("#direct_as_service").parent().find('label').addClass('ui-state-active').attr('aria-pressed',"true");
        }else{
          $("#direct_as_service").iCheck('check');
        }
        $('.way_name_row_aircompany.was_aircompany[data-default_group=aircompany]').hide();
      }else{
        $('.way_name_row_aircompany.was_direct').hide();
      }
      default_currency = $('#direct_as_service').data('default_currency');
      default_direct_row = $('.way_name_row_aircompany.was_direct[data-currency=' + default_currency + ']');
      this.aircompany_change_currency('#' + default_direct_row.attr('id'));
      this.check_visa_dedit_active();
      this.direct_as_service_active = $('div.service_package_js').find('label[for="direct_as_service"]').hasClass('ui-state-active');
    }
  },
  "div.service_package_js -> click": function(ev){
    var self = this;
    setTimeout(function(){
      var checked = $('div.service_package_js').find('label[for="direct_as_service"]').hasClass('ui-state-active');
      if(self.direct_as_service_active != checked){
        self.direct_as_service_active = checked;
        el = $("#direct_as_service");
        default_currency = el.data('default_currency');
        default_direct_row = $('.way_name_row_aircompany.was_direct[data-currency=' + default_currency + ']');
        aircompany_row = $('.way_name_row_aircompany.was_aircompany[data-default_group=aircompany]');
        if(checked){
          if( $('.aircompany_change_currency').length ){
            $('.aircompany_change_currency .sbOptions a[rel="' + default_direct_row.attr('id') + '"]').click();
          }else{
            default_direct_row.find('label').click();
          }
          aircompany_row.hide();
          default_direct_row.show();
        }else{
          aircompany_row.find('label').click();
          if(window['front_version'] != 'v2'){
            $("#direct_as_service").iCheck('uncheck');
          }
          $('.way_name_row_aircompany.was_direct').hide();
          aircompany_row.show();
        }
        $('.card_data:visible').find('.currency_select_js').val(default_currency).trigger("chosen:updated");
        self.aircompany_change_currency('#' + default_direct_row.attr('id'));
      }
    }, 0);
  },
 "select[name=aircompany_change_currency] -> change":function(ev){
    el = $(ev.target);
    var value = '#'+el.val();
    $('.way_name_row_aircompany.was_direct').show().not(value).hide();
    $(value).find('label').click();
    this.aircompany_change_currency(value);
  },
  ".currency_select_js -> change":function(ev){
    el = $(ev.target);
    var value = '#'+el.val();
    // var selector = $('.card-currency:visible').find('.currency_select_js');
    // var n_value = $(selector).find('option[value='+el.val()+']').text();
    var n_value = el.val();
    $.each(['card_number_0', 'card_number_1', 'card_number_2', 'card_number_3', 'card_date_year', 'card_date_month', 'card_number', 'card_holder'], function(i,id){
      $('#'+id+':disabled').val($('#'+id+':enabled').val());
    });
    $('.way_name_row_aircompany.was_direct').show().not(value).hide();
    $(value).find('label').click();
    this.aircompany_change_currency(value);
    $('.way_description_block_aircompany[data-payment_system_id='+$(value).data('payment_system_id')+']').find('.currency_select_js').select().val(n_value).trigger("chosen:updated");
  },
  aircompany_change_currency:function(ev){
    var self = this;
    var pay_currency = default_currency = $('.way_name_row_aircompany.was_aircompany').data('currency');
    var aircompany_cost = $('.way_name_row_aircompany.was_aircompany[data-default_group=aircompany]').data('topay');
    var default_direct_cost = $('.way_name_row_aircompany.was_direct[data-currency=' + default_currency + ']').data('topay');
    var pay_currency = $(ev).data('currency');
    var direct_cost_in_currency = $('.way_name_row_aircompany.was_direct[data-currency=' + pay_currency + ']').data('topay');
    var margin = default_direct_cost - aircompany_cost;
    if(pay_currency != default_currency){
      var rate = default_direct_cost / direct_cost_in_currency;
      margin = (margin/rate);
    }
    this.reload_direct_as_service(pay_currency,margin);

    // Change currency in alternative recomendations block
    if($('.s7-recommendations-block').length > 0){
      $.each($('.alternative-amount'), function(i, item){
        var item = $(item);
        item.html(amounts[i][pay_currency] + ' ' + pay_currency)
      });
    }
    this.cost.reloadPrice();
  },

  bind_copy_card_data: function(){
   $.each(['card_num', 'card_date', 'card_cvv','card_owner'], function(i, container_class) {
     var input = $('.payment_block_aircompany').find('.' + container_class + ' input[type="text"],input[type="tel"],input[type="password"]');
  
     input.removeClass('error');
     input.not(':disabled').unbind('keyup.card_input');
     input.not(':disabled').bind('keyup.card_input', function() {
       var el = $(this), el_name = el.attr('name');
       input.filter('[name="'+ el_name +'"]:disabled').val(el.val());
     })
   });
  },
  // ******************************
  // aircompany change currency end
  // ******************************


  "input[name=pay_aircompany] -> change":function(ev){

    el = $(ev.target);
    block = $('#'+el.attr('uniq_id')+'_block');

    if($('.other_card').length > 0 && !el.closest('li').hasClass('active')) {
      $(".other_card").click();
    }
    if(window['front_version'] == 'v2'){
      li = el.parents('div');
    }else{
      li = el.parents('li');
    }

    var active_payment_system = $('.way_name_row.active'),
        cost = li.attr('data-cost'), //is original cost, and data('cost') is changing due to payment markups
        puts = function(item, data){
          if(window['front_version'] == 'mobile' || window['front_version'] == 'v2'){
            item.text(data);
          }else{
            item.find('strong').text(data);
          }
        };//+' '+li.data('currency'));};

    active_payment_system.find('[data-payment-data]').each(function(i, item){
      var item = $(item),
          type = item.data('payment-data'),
          data = li.data(type);
      if(data)puts(item, data);
    });
    puts(active_payment_system.find('[data-payment-data=topay]'), cost);
    if(window['front_version'] == 'v2'){
      this.get_active_tab().find('strong').text(cost);
    }else{
      this.get_active_tab().find('span').text(cost);
    }

    /*DEBUG*/
    var id = li.data('payment_system_id');
    $('.way_name_row.active').data('payment_system_id', id);
    /*DEBUG*/


    /* Disable form data */
    active_block = $('.way_name_row_aircompany.active');
    $('#'+ active_block.attr('id').replace('group_title_', '')+'_block').find('input').attr('disabled', 'disabled');
    $('.way_name_row_aircompany').removeClass('active');
    el.parents('.way_name_row_aircompany').addClass('active');

    $('.way_description_block_aircompany').hide();

    block.find('input').attr('disabled', false);
    if(el.closest('li').hasClass('active') && this.element.find("#save_card_id").val()){
      this.element.find(".card_block.with_cards_list .card_data input:not(#card_cvv)").prop('disabled', true);
      $(".card_block.with_cards_list .card_data input#card_cvv").focus();
    }
    block.show();
    $('.choose_payment_way').find('.error').removeClass('.error');
    $.each(['card_cvv', 'card_date', 'card_number_2', 'card_holder'], function(i,id){
      $('#' + id + '_error').remove();
    });
    if ($('.way_name_row_aircompany.was_direct.active').length) {
      $('.aircompany_change_currency').show();
    }else{
      $('.aircompany_change_currency').hide();
    }
    if($(".aircompany_change_currency .select").length && $(".card_data:visible").length){
      $(".aircompany_change_currency .select").css("top", $(".card_data:visible").position().top+198);
    }


    this.bind_copy_card_data();
    this.set_price();
    this.set_fake_payment_system_and_group();
    this.check_visa_dedit_active();
    this.check_factura_vat();

    $('.card-type-list__item .iradio_minimal').removeClass('disabled');

    if($('.js_usblp_bonuses').length > 0){
      if($('.way_name_row_aircompany.active').data('default_group') == 'aircompany'){
        setTimeout( "$('[name=use_usblp_bonuses]').iCheck('uncheck')", 100);
        this.cost.setUsblpUseBonusesCheck(false);
        this.loadUsblpBonusesSelector(false);
        $('.js_usblp_bonuses').hide();
      }else{
        $('.js_usblp_bonuses').show();
      }
    }
    this.cost.reloadPrice();
  },
  define_paysystem: function(){
    var id = this.cost.getActivePaymentSystemId();
    var active_paysystem = $('[name=paysystem][value='+id+']');
    if(active_paysystem){
      $('[name=paysystem][type=hidden]').attr('disabled', true);
      $('select[name=paysystem]').attr('disabled', true);
      active_paysystem.attr('disabled', false);
    }
  },
  change_payment_system: function(ev){
    window.hide_error_popup('all');
    if(window['front_version'] == 'mobile' || ev.originalEvent == undefined){
      el = $(ev.currentTarget);
    }else{
      el = $(ev.originalEvent.currentTarget);
    }
    var payment_system_id = el.data('payment_system_id');
    var unique_id = el.data('payment_system_unique_id');
    var pay_group = el.data('pay_group');

    $('[name=pay_group]').first().val(pay_group);
    // $.cookie('selected_payment_group', pay_group, { path: '/', domain: domain });

    block = $('#'+unique_id+'_block');
    this.element.find(".my_cards_list li").removeClass("active");
    /* Disable form data */
    active_block = $('.way_name_row.active');
    $('#'+ active_block.attr('id').replace('group_title_', '')+'_block').find('input[name!="pay_aircompany"]').attr('disabled', 'disabled');


    $('.way_name_row').removeClass('active').hide();
    if(window['front_version'] == 'v2'){
      $('.price_details_block_js').hide();
      $('.price_details_block_js[data-payment_system_id='+payment_system_id+']').show();
    }
    $('.way_name_row[data-payment_system_id='+payment_system_id+']').addClass('active').show();
    // this.set_price(); //REPLACED to bottom
    $('.way_description_block').hide();

    if(block.find(".pay_aircompany_type").length > 0){
      var active_row_aircompany = block.find(".pay_aircompany_type .way_name_row_aircompany.active");
      if(active_row_aircompany.length > 0){
        $('#'+ active_row_aircompany.attr('id').replace('group_title_', '')+'_block').find('input').attr('disabled', false);
        $('#direct_as_service').attr('disabled', false);
        block.find('.js_tickets_bonuses').find('input').attr('disabled', false);
      }else{
        block.find('input').attr('disabled', false);
      }
    }else{
      block.find('input').attr('disabled', false);
      block.find('select[name=paysystem]').attr('disabled', false);
      typeof(jQuery().iCheck) != 'undefined' ? block.find('.js_tickets_bonuses').find('input').iCheck('update') : '';
    }
    this.prepare_legal_person_block( block );
    if(!block.hasClass('do_not_expand')){ block.show(); }
    $('.choose_payment_way').find('.error').removeClass('.error');
    $.each(['card_cvv', 'card_date', 'card_number', 'card_number_2', 'card_holder'], function(i,id){
      $('#' + id + '_error').remove();
    });

    if( $('#payment_way_'+payment_system_id).find('.with_external_order').length ){
      this.terminals_change($('.way_name_row.active').data('change-class'));
    }else{
      if ( $('#pay_button_disable').length ) {
        $('#pay_button_disable').attr('id', 'pay_button').parent('.cost').show();
      };
    };
    this.set_price();
    this.define_paysystem();
    this.check_factura_vat();
    if(pay_group == 'credit'){
      var status = credit.status;
      credit.showTemplateCredit(status,payment_system_id);
      credit.run();
      window.block_credit_open = true;
      if(status == "" || status == "info" ){
        $('#pay_button').show();
      }else{
        $('#pay_button').hide();
      }
        // var currency = this.cost.getActivePaymentSystem().getCurrency();
        // $('.booking_price_button').find('strong').bind("DOMSubtreeModified",function(){ GetInfoAboutCredit(payment_system_id, currency)});
        // GetInfoAboutCredit(payment_system_id, currency);
    }else{
      if(window.block_credit_open == true){
         window.block_credit_open = false;
         credit.end();
      };
      $('#pay_button').show();
      $('.booking_price_button').find('strong').unbind();
    };
    // $('input[name="use_user_bonuses"]:enabled').button( "option", "disabled", false );
    //if($('.use_bonus_block_js:visible input').length > 0){$('.use_bonus_block_js:visible input').button( "refresh" );}

    if("cash_map" == pay_group){
      cash_map.run();
      window.cash_map_open = true;
    }else{
      if(window.cash_map_open == true){
        window.cash_map_open = false;
        cash_map.end();
      }
    }
    this.cost.reloadPrice();
  },
  prepare_legal_person_block: function(block) {
    legal_person_block = block.find('.legal_person_block');
    if(legal_person_block.length > 0){
      legal_person_block.show();
      $("#legal_person_inn").prop("disabled", $('#individ').attr('checked') !== 'checked');
    }
  },
    /**
      IMPORTANT: attr('data-payment_system_id') != data('payment_system_id')
      attr('data-payment_system_id') це ідентифікатор першої згенерованої плат.системи
      по ньому привязується таба
    */
  get_active_tab: function(){
    var activePaymentSystem = $('.way_name_row.active'),
        id = activePaymentSystem.attr('data-payment_system_id');
        if(window['front_version'] == 'mobile'){
          var activeTab = $('.payment_tab').find('input[data-payment_system_id='+id+']');
        }else if(window['front_version'] == 'v2'){
          var activeTab = $('.payment_tab[data-payment_system_id='+id+']');
        }else{
          var activeTab = $('.payment_tab').find('a[data-payment_system_id='+id+']');
        }

    return activeTab;
  },
  get_tab_by_group_name: function(group_name){
    var tab = $('.payment_tab [data-pay_group='+group_name+']');
    if(!tab.length)console.error("Tab not found by group name: " + group_name);

    return tab;
  },
  change_payment_mark_up: function(value, currency_short){
    var payment_mark_up_percent = parseFloat($('[name=payment_mark_up_percent]').val());
    var payment_mark_up = (value / 100) * payment_mark_up_percent;
    $('#payment_mark_up_value').text(payment_mark_up.toFixed(2));
    $('#payment_mark_up_currency').text(currency_short);
  },
  set_price: function(){
    this.cost.reload();
    if(this.cost.hasBonusRule() && this.cost.bonusRule.canUse()){
      this.cost.toggleUseBonuses();
    }
  },

  next_unfilled_input: function(last_id){
    var unfilled = [], unfl;
    this.parent.bubbling = true;
    this.element.find("input:visible:not([readonly])").filter('[type=text],[type=password],[type=tel]').not('.ignore_tab').each(function(){
      if( $(this).val() === "" || $(this).val().replace(/\s+/, "").replace(/\s+/, "").replace("/", "") === "" ) {
        unfilled.push($(this));
      }
    });

    if(unfilled.length > 0) {
      unfl = unfilled[0];
      unfilled = [];
      this.parent.bubbling = false;
      if(!last_id || (last_id != unfl.attr('id'))) {
        setTimeout(function(){unfl.focus()},100);
      }
    }
  },

  // init_fancybox_tips: function(){
  //   $(".aircompany_dpayment_low").fancybox({ titleShow: false, centerOnScroll: true, width: 300,height: 300 });
  // },

  setup_magnific_inline: function(){
       window.enable_magnific_inline();
      // $( document ).ready(function() {
      // $('.js-magnific-link-inline').each(function() {
      //     $(this).magnificPopup({
      //       items : {
      //         src:  $(this).attr('href'),
      //         type: 'inline'
      //       },
      //       callbacks:{
      //         open: function(){
      //           var popupHeight = $('.popup');
      //           $('.mfp-inline-holder .popup').css('margin-top', -popupHeight.height()/2);  // for Ipad
      //         },
      //       }
      //     });
      //   });
      // });

    },


  clear_form: function(){
    $('.way_description_block,.way_description_block_aircompany').not(':visible').find('input[name!="pay_aircompany"]').attr('disabled', 'disabled');
  },
  timer_start:function(){
    // Debug for multi initialization
    if(this.parent.diff != undefined) return;

    var self = this;
    this.parent.diff = self.timer.data("diff");
    var interval = setInterval(
      function(){
        var date =  gmdate('H:i:s',self.parent.diff).split(":");
        var days = Math.floor(self.parent.diff/(60*60*24));
        if(days > 0){
          var hours = days * 24 + parseInt(date[0]);
        }else{
          var hours = date[0];
        }
        if(self.timer.find(".digits").length > 1){
          self.timer.find(".digits:eq(0)").text(hours);
          self.timer.find(".digits:eq(1)").text(date[1]);
          self.timer.find(".digits:eq(2)").text(date[2]);
        } else {
          self.timer.find(".digits").text(hours+' : '+date[1]+' : '+date[2]);
        }
        self.parent.diff--;
        if(!Number(date[0]) && !Number(date[1]) && !Number(date[2])){
          function end_session_redirect() {
            $(window).unbind('beforeunload');
            if(window.cur_domain == 'my'){
              $('.watch').hide();
              location.reload(true);
              return false;
            }
            window.location.href = "/";
            clearInterval(interval);
            return false;
          }
          if (typeof(window.payment_end_session_message) !== 'undefined' && window.payment_end_session_message) {
            message('msg_title', window.payment_end_session_message, 'continue_button', function(){
              end_session_redirect();
            }, false);
            return false
          } else {
            return end_session_redirect();
          }
        }
      }
      ,1000);

  },
  change_currency_for_payment_card: function(){
    var self = this;
    var paymentCardBlock = $('#choose_currency_for_payment_card');
    if(!paymentCardBlock.length)return false;
    var paymentSelectBox = paymentCardBlock.find('select').selectbox("detach"),
    paymentDirect = $('[data-payment-type=direct]').first(),
    directCard = $('.direct_card'),
    href = window.location.href,
    pattern = /https:\/\/my\./,//set and get selected_currency from cookie only when subdomain is my.tickets
    use_cookie_for_currency =  pattern.test(href);
    tabs = $('.payment_tab');
    var active_row = this.get_active_payment_row();
    var active_payment_system_id = active_row.data('payment_system_id');
    var selectbox = $('.select_card_type');
    if(selectbox.length > 0){
      var select = selectbox.find('select');
      this.payment_markups_subject = new PaymentMarkupSubject(selectbox);
    }
    directCard.each(function(index, item){
      var $this = $(this),
      id = $this.data('payment_system_id'),
      currency = $this.data('params').head.currency,
      option = $('<option></option>', {value: id, text: currency});

      paymentSelectBox.append(option);
      //2. register PaymentMarkupObservers for each payment system with hidden data
      if(selectbox.length > 0) self.payment_markups_subject.registerObserver($this.data());
    });

    paymentSelectBox.selectbox({
      onChange: function(val, inst){
        var $this = $('.direct_card[data-payment_system_id='+val+']'),
        id = $this.data('payment_system_id'),
        currency = $this.data('params').head.currency_short,
        currency_code = $this.data('params').head.currency,
        cost = $this.data('params').head.cost,
        data = $this.data('params').body,
        directTab = self.get_tab_by_group_name('direct');

        //send notification to prepare selectbox with payment markups for payment system
        self.restore_payment_system_and_group();
        if(selectbox.length > 0) self.payment_markups_subject.notify_observer(id);

        $.each(data, function(key, value){
          paymentDirect.find('[data-payment-data='+key+']').find('strong').text(value);
        });
        paymentDirect
        .data({
          payment_system_id: id,
          cost: cost,
          currency: currency
        })
        .find('[name=pay_group]').change();

        self.cost.updateTextNode(directTab.contents().first()[0], data.name);
        directTab.find('span').text(data.topay);

        self.change_payment_mark_up(cost, currency);

        self.set_price();
        $('#'+ paymentDirect.attr('id').replace('group_title_', '')+'_block').find('[name=paysystem]').attr('value', id).val(id);


        var det_block = $('#'+ paymentDirect.attr('id').replace('group_title_', '')+'_block');
        if(det_block.length > 0){
          if($('#choose_currency_for_payment_card select option').eq(0).html() == currency){
            det_block.find('.summ_description .summ_convert').show();
            det_block.find('.will_be_charged p').eq(1).show();
          }else{
            det_block.find('.summ_description .summ_convert').hide();
            det_block.find('.will_be_charged p').eq(1).hide();
          }
        }

        $.cookie("selected_direct_currency",$this.data('params').head.currency, { path: '/', domain: domain });
      }
    });
    paymentSelectBox.selectbox('attach');

    if(use_cookie_for_currency){
    var item = directCard.filter(function(i, item){
      var currency = $(item).data('params').head.currency;
      if(currency === $.cookie('selected_direct_currency'))return true;
    });
      if(item.length)
      paymentCardBlock.find('a[rel='+item.data('payment_system_id')+']').click();
    }else {
      paymentCardBlock.find('a[rel]').first().click();
    }
    paymentSelectBox.selectbox('close');
  },

  paymentScroll:  function (){
    if($('.payment-carousel li').size() > 5){
      var carousel = $('.payment-carousel'),
          carouselWrapper = carousel.parents('.payment-carousel__wrapper'),
          carouselItem = $('.payment-carousel li'),
          carouselItemLength =  carouselItem.size(),
          carouselItemWidth = carouselItem.outerWidth(true);
      carousel.addClass('on');
      carouselWrapper.css('padding','0 50px')
      carousel.width(carouselItemLength*carouselItemWidth);
      carouselWrapper.append('<a class="next-slide"></a><a class="prev-slide enabled" ></a>');
      var carouselNext = carouselWrapper.find('.next-slide'),
          carouselPrev = carouselWrapper.find('.prev-slide');
      carouselNext.click(function() {
        $( carousel ).animate({
          left :  carouselWrapper.width()- carousel.width() + 60
        }, 500 , function(){
          carouselNext.addClass('enabled');
          carouselPrev.removeClass('enabled')
        });
      });
      carouselPrev.click(function() {
        $( carousel ).animate({
          left : 60
        }, 500 , function(){
          carouselPrev.addClass('enabled');
          carouselNext.removeClass('enabled')
        });
      });
    };
  },

  additionalPricesSet: function(id,text,price,html){
    this.additionalPrices[id] = {text: text, price: price};
    html = html || '';
    var block = $('.additional_prices_js');
    var discount = (price < 0) ? ' discount' : '';
    var div = '';
    $('#addP_'+id).hide();
    if(price != 0){
      if(id == 'price') text = '<strong>'+text+'</strong>';
      div = '<div class="col-6 col-xl-8 col-l-10'+discount+' col-m-12">'+text+'</div>'+
        '<div class="col-4 col-xl-4 col-l-2'+discount+' col-m-12">'+
          '<strong>'+price+' '+this.cost.getActivePaymentSystem().getCurrency()+'</strong>'+
        '</div>'+
         html;
      if($('#addP_'+id).length < 1){
        div = '<div id="addP_'+id+'" class="row">'+div+'</div>';
        block.append(div);
      }else{
        $('#addP_'+id).html(div).show();
      }
    }
  },
  reload_promotion_info: function (amount, is_percent, check_promo, show_block){
    this.cost.setPromotionCost(amount, is_percent);
    this.cost.setUsePromotionCheck(check_promo);
    this.cost.reload();
    if (!show_block && $("#addP_promocodes").length) $("#addP_promocodes").hide();
  },
  clear_promo_error: function(name){
    var name = !!name ? $('[name='+name+'] + .js-clear') : $('.js-clear');
    name.each(function(){
      name.on('click', function(ev){
        ev.preventDefault();
        name.parent().find('input[type="text"].error').removeClass('error').val('').focus();
        name.parent().find('span.error').remove();
        name.remove();
      });
    });
  },
  check_promocode_value: function(input){
    var controller = this,
        _self = input,
        promoMaxLength = _self.attr('maxlength'),
        promoVal = _self.val(),
        checkboxes = $('[name=use_promocode]'),
        promoValid = '<span class="promocode-valid"></span>',
        promoError = '<span class="error error--promocode js-code-error">%error_msg%</span>',
        promoLoader = '<span class="loader loader--inline js-code-loader"><img src="/img/loaders/loader_s.gif" alt="loader"/>' + window.I18n.wait_for_commit + '</span>',
        promoBtnClear = '<a href="javascript:void(0)" class="btn-clear js-clear"></a>';
    if (this.promocode_value != "" && promoVal.length < promoMaxLength) {
      this.promocode_value == "";
      _self.removeClass('error');
    }
    if (promoVal.length == promoMaxLength && promoVal == this.promocode_value) {
      return;
    }

    promoVal.length <= promoMaxLength ? _self.removeClass('error, checking').parent().find('.js-code-error, .js-clear, .promocode-valid').remove() : '';
    if (promoVal.length == promoMaxLength && (!_self.parent().find('.js-code-loader').length || !_self.parent().find('.js-code-error').length ) && promoVal != this.promocode_value) {
      this.promocode_value = promoVal;
      var data = {
        "code": promoVal,
        "session_id": window.session_id
      };
      if (window.cur_domain == "avia") {
        data["recommendation_id"] = window.recommendation_id;
      }
      $.ajax({
        url:'/' + window.lang_prefix + 'promotion/check_promotion_code',
        type: 'post',
        data: data,
        dataType:"json",
        beforeSend:function(){
          _self.after(promoLoader);
          _self.removeClass('error').addClass('checking').attr('readonly', 'readonly');
        },
        success: function(response){
          _self.removeAttr('readonly').removeClass('checking');
          _self.parent().find('.js-code-loader').remove();
          if (response.success) {
            _self.removeClass('error').after(promoValid);
            controller.reload_promotion_info(response.details.amount, response.details.percentage, true, true);
          } else {
            promoError = promoError.replace("%error_msg%", response.msg);
            _self.addClass('error').after(promoError).after(promoBtnClear);
            controller.reload_promotion_info(0, false, false, false);
            controller.clear_promo_error();
          }
          checkboxes.each(function(i, cur_cbox){
            var text_input =$(cur_cbox).closest(".js-section-additional").find(".js-promocode-input");
            if (_self.attr("id") != text_input.attr("id")){
              text_input.closest('.js-section-additional').find('span.promocode-valid, span.error--promocode, .js-clear').remove();
              text_input.val(promoVal);
              if (response.success) {
                text_input.removeClass('error').after(promoValid);
              } else {
                text_input.addClass('error').after(promoError).after(promoBtnClear);
                controller.clear_promo_error(text_input.attr("name"));
              }
            }
          });
        },
        error: function(xhr, ajaxOptions, thrownError){
          _self.removeAttr('readonly').removeClass('checking');
          _self.parent().find('.js-code-loader').remove();
          return;
        }
      });
    } else {
      this.reload_promotion_info(0, false, false, false);
    }
  }
});

function payment_block_change_address(){
  cities = pay_cash_cities[$('#cash_city').val()];
  el = $('#cash_address');
  el.empty();
  $.each(cities, function(key, value){
      $('#cash_address').append($("<option></option>").attr("value",value[0]).text(value[1]));
  });
  el.selectbox("detach").selectbox("attach");
}

function payment_block_change_address_alt(){
  cities = pay_cash_cities[$('#cash_city').val()];
  el = $('#cash_address');
  el.empty();
  $.each(cities, function(key, value){
      $('#cash_address').append($("<option></option>").attr("value",value[0]).text(value[1]));
  });
  el.selectbox("detach").selectbox("attach");
  payment_block_change_address_phone_alt();
}

function payment_block_change_address_phone_alt(){
  $('.office_phone_alt').html(pay_cash_phones[$('#cash_address').val()]);
}

function vd_error(){
  window.close_message();
  var sel_direct_ps = $('.way_name_row input[value=direct],.way_name_row input[value=aircompany]').eq(0);
  sel_direct_ps.attr('checked', true).trigger('change');
  $('.way_name_row .iradio_minimal').removeClass('checked');
  sel_direct_ps.parents('.iradio_minimal').addClass('checked');
  return false;
}

/**
* Для синхронізації карткових даних між платіжними системами
* CardData виступає в ролі медіатора (посердника), який дозволяє спілкуватись
* об'єктам (Observer) між собою, тільки з однаковим ідентифікатором.
*
* <div class='card_data'>___
*                           |
*                           <input id="card_name_0" /> вводимо'foo' в це поле
*
*  <div class='card_data'>___
*                            |
*                             <input id="card_name_0" /> Значення поля стає 'foo'
*/
function CardData(){
  var observers = {};
  var canNotify = true;
  this.registerObserver = function(obj){
    var observer = new Observer(obj, this);
    var key = observer.id;
    if(!observers.hasOwnProperty(key)) observers[key] = [];
    observers[key].push(observer);
    return observer;
  };
  this.removeObserver = function(obj){
    var key = obj.attr('id');
    delete observers[id];
  };
  this.removeAll = function(){
    observers = {};
  };
  this.stopNotification = function(){
    canNotify = false;
  };
  this.resumeNotification = function(){
    canNotify = true;
  };
  this.canNotify = function(){
    return canNotify;
  };
  this.notifyAll = function(data, sender){
    if(jQuery.isEmptyObject(observers)) return false;
    if(!(sender instanceof Observer))throw new Error('sender is not an Observer obj');


    for(var i in observers[sender.id]){
      var observer = observers[sender.id][i];
      if(observer instanceof Observer && observer !== sender) observer.update(data);
    }
  };
};
function Observer(obj, subject){
  if(!(obj instanceof jQuery))throw new Error("Observer's obj must be jQuery instance");
  var self = this;
  this.obj = obj;
  this.subject = subject;
  this.id = obj.attr('id');
  obj.on('blur', function(e){
    var me = $(this);
        value = me.val();

      if(self.subject.canNotify()) self.subject.notifyAll(value, self);
  });

  this.update = function(data){
    // placeholder for card input XXXX
    if(self.obj.attr('placeholder') === 'undefined'){
      (data.length) ? self.obj.removeClass('ph_bg') : self.obj.addClass('ph_bg');
    }
    self.obj.val(data);
  }
};
/**
* дозволяє користувачеві вибрати карту оплати на сторінці бронювання
*   ______________________
*  |                      | При виборі певної карти розмір платіжної націнки
*  | ALL               /\ | добавляється до загальної суми квитка
*  |______________________|
*  |                      |
*  |  VISA CREDIT +25.4 ---- платіжна націнка
*  |______________________|
*
*/
function PaymentMarkupSubject(selectbox){
  var self = this;
  var observers = {};
  this.selectbox = selectbox;
  var select = this.selectbox.find('select');


  this.get_controller = function(){
    var controller = $('.payment_block').controller();
    return controller;
  };
  this.registerObserver = function(data){
    if(data.payment_markups && data.payment_markups.length){
      var id = data.payment_system_id;
      var observer = new PaymentMarkupObserver(data, this);
      if(observers.hasOwnProperty(id)){ console.warning('duplication!'); }
      observers[id] = observer;
      return observer;
    }
    return false;
  };
  this.discharge_selectbox = function(){
    this.selectbox.hide();
    var select = this.selectbox.find('select');
    select.selectbox('detach');
    var siblings = select.find('option[name=clear_payment_markup]').siblings();
    $.each(siblings, function(i, item){ item.remove(); });
  };
  this.charge_selectbox = function(){
    var select = this.selectbox.find('select');
    select.selectbox('attach');
    this.selectbox.show();
  };
  this.addOnChangeEvent = function(){
    var self = this;
    var controller = self.get_controller();
    var select = self.selectbox.find('select');
    select.selectbox({
      onChange: function(val, obj){
        self.notify(parseFloat(val));
        controller.set_price();
        controller.set_fake_payment_system_and_group(); // for payment markups
      }
    });
  };
  this.notify_observer = function(id){
    var observer = this.find_observer(id);
    if(observer instanceof PaymentMarkupObserver){
      observer.prepare();
    }else{
      this.discharge_selectbox();
    }
  };
  this.notify = function(payment_markup){
    var observer = this.find_observer();

    if(observer instanceof PaymentMarkupObserver){
      observer.update(payment_markup);
    }else{
      this.discharge_selectbox();
    }
  };
  this.find_observer = function(id){
    var id = id || parseInt($('.way_name_row.active').data('payment_system_id'));
    return observers[id];
  }
};
function PaymentMarkupObserver(data, subject){
  var self = this;
  this.data = data;
  this.subject = subject;

  this.get_controller = function(){
    var controller = $('.payment_block').controller();
    return controller;
  };
  this.prepare = function(){
    var select = self.subject.selectbox.find('select');
    self.subject.discharge_selectbox();
    self.data.payment_markups.forEach(function(item){
      var title = item.name;
      if(item.payment_markup > 0){
        title += " (+" + item.payment_markup + ")";
      }
      var option = $('<option></option>', { text: title, value: item.payment_markup });
      option.data('is_fake', item.is_fake);
      select.append(option);
    });
    self.subject.addOnChangeEvent();
    self.subject.charge_selectbox();
  };
  this.update = function(payment_markup){
    var controller = this.get_controller();
    var active_row = controller.get_active_payment_row(); // OPTIMIZE:
    var cost = this.data.params.head.cost;
    var final_cost = (payment_markup == 0) ? cost : (cost + payment_markup);
    active_row.data('cost', final_cost);
  };
};

$(".select-popup-overlay").live('click', function(e) {
  $('.select-popup-overlay').remove();
});

function payment_step(step){
  if(step == 1){
    $('.extras').show();
    $('.flight_more_js').show();
    $('.pay_block_2_js').hide();
    $('.accept_checkbox_js').hide();
    $('.btn-wrapper.buy-ticket').hide();
    setTimeout("$('.back-arrow:first').attr('href',window['back_href']);",100);
    window.scrollTo(0,0);
    location.hash = '';
    // $('.service__title').html($('.ui-content').attr('data-booking_title'));
  }else if(step == 2){
    $('.extras').hide();
    $('.flight_more_js').hide();
    $('.pay_block_2_js').show();
    $('.accept_checkbox_js').show();
    $('.btn-wrapper.buy-ticket').show();
    window['back_href'] = $('.back-arrow:first').attr('href');
    $('.back-arrow:first').attr('href','javascript:void(0);').on("click",function(){payment_step(1);});
    window.scrollTo(0,0);
    location.hash = '#page';
    if(window['onInit'] == undefined){
      if ($('select[name=aircompany_change_currency][data-referer_default_currency]').length) {
        referer_currency = $('select[name=aircompany_change_currency]').data('referer_default_currency');
        if ($('.way_name_row_aircompany.was_direct[data-currency=' + referer_currency + ']').length) {
          var referer_currency_row_id = $('.way_name_row_aircompany.was_direct[data-currency=' + referer_currency + ']').attr('id');
          $('.card-currency:visible select').val(referer_currency_row_id).change();
        }
      }
      window['onInit'] = true;
    }
    setTimeout("$('.payment_block').controller().cost.reload();$('.payment_block').controller().load_default_markup_prices();if(typeof(googlemap_chash_map_small) != 'undefined'){ googlemap_chash_map_small.resize(); }",100);
    // $('.service__title').html($('.ui-content').attr('data-pay_title'));
  }
}

function PaymentCard(){
  this.active = false;
  this.momentum_nums = [63, 66, 67, 68, 69];
  this.validationRule = 'valid_card_number_maestro_momentum';
  this.wrapper = $('.card_data:visible');
  this.cardInputWrapper = $('.card-num-wrapper:visible');

  this.getNumberInputs = function(){
    var numbers = this.wrapper.find('.card_num input:visible');
    return numbers;
  };
  this.getCount = function(){
    var count = 0;
    var numbers = this.getNumberInputs();

    numbers.each(function(i, number){
      count += number.value.length;
    });

    return count;
  };
  this.bindListener = function(){
    var self = this;
    var numbers = this.getNumberInputs();

    numbers.each(function(i, number){
      $(number).on('keyup', function(e){
        self.operate(e);
      });
    });
  };
  this.getFirstInput = function(){
    return this.getNumberInputs().first();
  };
  this.numberStarts = function(number){
    var starts = false;
    this.momentum_nums.forEach(function(num){
      if(number.indexOf(num) == 0){
        starts = true;
        return starts;
      }
    });

    return starts;
  };
  this.setActive = function(active)
  {
    // if(this.active !== active){
    //   console.log('MOMENTUM: ', (active ? 'ACTIVATED' : 'DEACTIVATED'));
    // }
    this.active = active;
  };
  this.disableInput = function(input)
  {
    input.val('').prop('disabled', true);
  };
  this.enableInput = function(input)
  {
    input.prop('disabled', false);
  };
  this.operate = function(e){
    var self = this;
    var count = this.getCount();
    var firstInput = this.getFirstInput();

    firstInput.on('keyup', function(e){
      var active = self.numberStarts(e.target.value);
      self.setActive(active);

      if(active){
        self.whenActive();
      }else{
        self.whenUnactive();
      }
    });

    if(this.getCount() === 18){
      // console.log('interesting things coming)))...');
      $('.card_owner').hide();
      this.disableInput($('#card_holder'));
      $('.card_cvv').hide();
      this.disableInput($('#card_cvv'));
      $('#if_you_have_cvv')
        .removeAttr('disabled')
        .css("display","inline-block")
        .off().on('click', function(e){
          e.preventDefault();
          self.enableInput($('#card_cvv'));
          $('.card_cvv').show();
          $('#if_you_have_cvv').hide();
        });
    }else{
      // console.log('it is boring..(((');
      if($('.card_owner').is(':hidden')){
        this.enableInput($('#card_holder'));
        this.enableInput($('#card-cvv'));
        $('.card_owner').show();
        $('.card_cvv').show();
        $('#if_you_have_cvv').hide();
      }
    }
  };
  this.getAdditionalInput = function(){
    var id = '#'+ this.additionalCardNumberId;
    return this.wrapper.find(id);
  };
  this.whenUnactive = function(){
    if(this.hasAdditionalInput()){
      this.getAdditionalInput().hide().val('').prop('disabled', true);
    }
    this.removeValidationRule();
    $('#card_holder_not_required').hide();
    $('#card_holder').attr('required', 'required');
  };
  this.whenActive = function(){
    if(!this.hasAdditionalInput()){
      var input = this.addNumberInput();
      this.cardInputWrapper.append(input);
      this.additionalInput = input;
      this.fixTabIndex();
      this.prepareValidationRule();
    }else{
      if(this.getAdditionalInput().is(':hidden')){
        this.getAdditionalInput().show().prop('disabled', false);
      }
    }
    this.addValidationRule();
    $('#card_holder').removeAttr('required');
    $('#card_holder_not_required').removeAttr('hidden').show();
  };
  this.hasAdditionalInput = function(){
    return (typeof this.additionalInput === 'object');
  };
  this.fixTabIndex = function(){
    var numbers = this.getNumberInputs();
    var lastIndex = parseInt(numbers.last().attr('tabindex'));

    numbers.each(function(i, number){
      number = $(number);
      var index = parseInt(number.attr('tabindex'));
      index -= 1;
      number.attr('tabindex', index);
      number.prop('tabindex', index);
    });
  };
  this.addNumberInput = function(){
    var numbers = this.getNumberInputs();
    var input = numbers.last().clone(true);

    var tabindex = parseInt(input.attr('tabindex')) + 1;
    var id = input.attr('id').match(/\d$/).shift();
    id = parseInt(id) + 1;
    var name = 'card_number[' + id + ']';
    this.additionalCardNumberId = 'card_number_' + id;

    var attrs = {
      id: this.additionalCardNumberId,
      'data-length': 2,
      maxlength: 2,
      name: name,
      placeholder: 'XX',
      tabindex: tabindex
    };
    input.attr(attrs);

    return input;
  };
  this.addValidationRule = function(){
    this.getFirstInput()
      .addClass(this.validationRule)
      .removeClass('valid_card_number')
      .removeClass('valid_card_number_visa_master');
  };
  this.removeValidationRule = function(){
    this.getFirstInput()
      .removeClass(this.validationRule)
      .addClass('valid_card_number')
      .addClass('valid_card_number_visa_master');
  };
  this.prepareValidationRule = function(){
    var self = this;

    $.validator.addMethod(self.validationRule, function(value, element){
      var first_n = $(element).parents('.card_num').find('input:first').val().substr(0, 2);

      var matches = self.numberStarts(first_n);
      if(!matches){
        $(element).parent().addClass('error');
      }

      return matches;
    }, "Please enter a valid card number. Maestro MOMENTUM");
  };
  this.init = function(){
    this.bindListener();
  };
}
