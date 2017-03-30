function Cost(){
  this.paymentSystems = {};
  this.exchangeData = [];

  this.init = function(options){
    this.prepareExchanges();
    this.preparePaymentSystems();
    this.prepareBonusRule();
    this.preparePromotionRule();
    this.waitingServiceTime = 100;
    this.useUsblpBonusesCheckedFlag = false;
    this.usePromotionCheckedFlag = false;
    this.usePromotionPercentDiscount = false;

    if(this.hasCalculationService()){
      var self = this;
      setTimeout(function(){
        self.callCallback(options.fn, options.scope);
      }, self.waitingServiceTime);
    }else{
      this.callCallback(options.fn, options.scope);
    }
  };
  this.prepareExchanges = function(){
    if($('#exchanges').length > 0){
      var data = JSON.parse($('#exchanges').val());
      var exchanges = [];
      $.each(data, function(i, item) {
        exchanges[i] = item['rate'];
      });
      this.exchangeData = exchanges;
    }
  };
  this.exchangeRate = function(to, from){
    if(from == undefined){
      return 1/this.exchangeData[to];
    }else{
      if(this.exchangeData[to] == 1){
        return this.exchangeData[from];
      }else{
        return this.exchangeData[from]/this.exchangeData[to];
      }
    }
  };
  this.callCallback = function(fn, scope){
    if(typeof fn === 'function' && typeof scope === 'object'){
      fn.call(scope);
    }else{
      //console.warn("callback wasn't called");
    }
  };
  this.preparePaymentSystems = function(){
    var self = this;
    var paymentSystemElements = $('.payment_system');
    paymentSystemElements.each(function(i,item){
      var item = $(item);
      var id = item.data('payment_system_id');
      var data = item.data('params');
      self.paymentSystems[id] = new PaymentSystem(data);
    });
  };
  this.hasPaymentSystems = function(){
    return !jQuery.isEmptyObject(this.paymentSystems);
  };
  this.prepareBonusRule = function(){
    var bonus_rule_storage = $('#bonus_rule');
    if(bonus_rule_storage.length && bonus_rule_storage.data('bonusRule')){
      this.bonusRule = new BonusRule(bonus_rule_storage.data('bonusRule'));
    }
  };
  this.preparePromotionRule = function(){
    var promotion_rule_storage = $('#promotion_rule');
    if(promotion_rule_storage.length && promotion_rule_storage.data('promotionRule')){
      this.promotionRule = new PromotionRule(promotion_rule_storage.data('promotionRule'));
    }
  };
  this.refreshBonusRule = function(user){
    if(user.bonus_rules[window.cur_domain] != undefined){
      var _use_bonus = {
        can_use: user.can_use_bonuses,
        allowed_services: user.bonus_services,
        minimal_payment: user.bonus_rules[window.cur_domain].payment,
        reward: user.bonus_rules[window.cur_domain].amount,
        necessary_minimum: user.bonus_rules[window.cur_domain].minimum,
        available_bonus: user.available_bonus,
      };
      this.bonusRule = new BonusRule(_use_bonus);
      this.toggleUseBonuses();
    }
  };
  this.hasBonusRule = function(){
    return (typeof this.bonusRule === 'object');
  };
  this.getBonusRule = function(){
    return this.bonusRule;
  };
  this.hasPromotionRule = function(){
    return (typeof this.promotionRule === 'object');
  };
  this.getPromotionRule = function(){
    return this.promotionRule;
  };
  this.getPaymentSystems = function(){
    return this.paymentSystems;
  };
  this.getActivePaymentSystemId = function(){
    var row =  $('.way_name_row.active');
    var id = row.data('payment_system_id');
    return id;
  };
  this.getActivePaymentSystem = function(){
    var id = this.getActivePaymentSystemId();
    var paymentSystem = this.findPaymentSystemById(id);
    return paymentSystem;
  };
  this.findPaymentSystemById = function(id){
    return this.paymentSystems[id];
  };
  this.getActiveBlockElement = function(){
    var paymentSystem = this.getActivePaymentSystem();
    var groupName = paymentSystem.getGroupName();
    var block = $('.way_description_block[data-group='+groupName+']');
    return block;
  };
  this.getBonusBlockElement = function(){
    var block = this.getActiveBlockElement();
    var groupName = this.getActivePaymentSystem().getGroupName();
    var bonusBlock = block.find('#'+groupName+'_bonus');
    return bonusBlock;
  };
  this.getBonusCost = function(){
    var paymentSystem = this.getActivePaymentSystem();
    var defaultCurrency = this.getDefaultCurrency();
    var bonusCost = paymentSystem.getCostByDefaultCurrency(defaultCurrency, true);
    var rate = paymentSystem.getRate();
    if($('.card_currency:visible').length > 0){
      bonusCost = parseFloat($('.way_name_row.active').attr('data-cost'));
    }else if($('.aircompany_change_currency:visible').length > 0){
      bonusCost = parseFloat($('[data-currency_code="'+defaultCurrency+'"][data-default_group="direct"]').data('topay'));
    }
    bonusCost += this.getMarkupBonus();
    if(this.hasCalculationService() && this.hasAdditionalBonusServices()){
      var additionalServicesCost = this.getAdditionalServicesCost(); // отримуємо вартість усіх додаткових послуг

      if(!this.hasPaymentSystemDifferentRealPayCurrency(paymentSystem)){
        additionalServicesCost *=  rate;
      }
      bonusCost += additionalServicesCost;
    }
    bonusCost += this.getAdditionalServicesCost();

    return bonusCost;
  };
  /*
  * Перевіряє чи реальна платіжна валюта не співпадає з валютою плат.системи та валютою сайту
  *
  * Допустимо валюта сайту - RUR.
  * якщо валюта плат.системи також RUR, але реальна платіжна валюта EUR
  * тоді, нам не потрібно конвертувати ціну
  * так як ціна уже згідно валюти сайту
  *
  * @param PaymentSystem paymentSystem
  * @return bool
  */
  this.hasPaymentSystemDifferentRealPayCurrency = function(paymentSystem){
    var defaultCurrency = this.getDefaultCurrency();
    return (paymentSystem.isCurrencyEquals(defaultCurrency) && !paymentSystem.isCurrencyEqualsRealPayCurrency());
  }
  this.getAdditionalBonusServices = function(){
    if(typeof this.additionalBonusServices == 'undefined'){
      var self = this;
      var services = this.getAdditionalServices();
      var allowedBonusServices = this.bonusRule.getAllowedServices();
      var bonusServices = [];
      services.forEach(function(service){
        var serviceName = service.mainWrapp.data('service');
        if($.inArray(serviceName, allowedBonusServices) >= 0){
          bonusServices.push(service);
        }
        service.addSubscriber(self);
      });
      this.additionalBonusServices = bonusServices;
    }
    return this.additionalBonusServices;
  };
  this.hasAdditionalBonusServices = function(){
    var services = this.getAdditionalBonusServices();
    var has = (services.length > 0);
    return has;
  };
  this.getAdditionalServices = function(){
    var services = [];
    if (typeof this.calculationService != 'undefined') {
      services = this.calculationService.calculationServices;
    }
    return services;
  };
  this.getAdditionalServicesCost = function(commonServicesOnly){
    var cost = 0;
    if(typeof(PriceCalculationObj) != "undefined"){
      if(commonServicesOnly){
        var services = PriceCalculationObj.additionalServices;
        var list = JSON.parse($('#additional_services_in_main_price').val());
        if(services != undefined && Object.keys(services).length > 0){
          for(name in services){
            if(list.indexOf(name) >= 0 && services[name].selfPrice > 0){
              cost += parseFloat(services[name].selfPrice);
            }
          }
        }
      } else {
        var services = this.getAdditionalBonusServices();
        services.forEach(function(service){
          var servicePrice = service.selfOriginalPrice ? service.selfOriginalPrice : service.selfPrice;
          cost += servicePrice;
        });
      }
    }
    return cost;
  };
  this.getBonusAmount = function(){
    this.getBonusCost();
    var bonusCost = this.willBeCharged();
    var bonusReward = this.bonusRule.getReward();
    var amount = bonusCost * bonusReward;
    var paymentSystem = this.getActivePaymentSystem();
    var rate = paymentSystem.getRate();

    amount = window.formatNumber(amount, 2); //TODO: винести цифру заокруглення
    return amount;
  };
  this.getUsblpBonusAmount = function(){
    this.getBonusCost();
    var bonusCost = this.willBeCharged();
    var bonusReward = 0.02;
    var amount = bonusCost * bonusReward;
    var paymentSystem = this.getActivePaymentSystem();
    var rate = paymentSystem.getRate();

    amount = window.formatNumber(amount, 2); //TODO: винести цифру заокруглення
    return amount;
  };
  this.updateService = function(service){
    var services = this.getAdditionalBonusServices();
    if($.inArray(service, services) >= 0){
      this.reloadBonuses();
    }
    this.reloadPrice();
  };
  this.reloadBonuses = function(){
    if(!this.hasBonusRule()) return false;
    var amount = this.getBonusAmount(),
        usblp_amount = this.getUsblpBonusAmount(),
        paymentSystem = this.getActivePaymentSystem(),
        currency = this.getDefaultCurrencyShort();

    this.updateUsblpBonusBlock(usblp_amount, currency);
    this.updateBonusBlock(amount, currency);
  };
  this.toggleUseBonuses = function(){
    var paymentSystem = this.getActivePaymentSystem();
    var bonus = this.getBonusBlockElement();
    var use_bonuses_check = bonus.find('.js_tickets_bonuses .use_bonuses_check');
    if(use_bonuses_check.length){
      paymentSystem.canUseBonus() ? use_bonuses_check.show() : use_bonuses_check.hide();
    }
  };
  this.updateUsblpBonusBlock = function(amount, currency){
    var block = this.getBonusBlockElement(),
        bonusesCount = block.find('.js_usblp_bonuses .bonuses_count'),
        bonusesAmount = block.find('.js_usblp_bonuses .bonuses_amount'),
        bonusesCurrency = block.find('.js_usblp_bonuses .bonuses_currency');

    bonusesCount.text(amount);
    bonusesAmount.text(amount);
    bonusesCurrency.text(currency);
  };
  this.updateBonusBlock = function(amount, currency){
    var block = this.getBonusBlockElement(),
        bonusesCount = block.find('.js_tickets_bonuses .bonuses_count'),
        bonusesAmount = block.find('.js_tickets_bonuses .bonuses_amount'),
        bonusesCurrency = block.find('.js_tickets_bonuses .bonuses_currency');

    bonusesCount.text(amount);
    bonusesAmount.text(amount);
    bonusesCurrency.text(currency);
  };
  this.reloadPriceInTab = function(price, currency, group_name){
    directTab = $('.payment_tab.ui-state-active');
    directTab.find('span').text(price + ' ' + currency);
    if(window['front_version'] == 'v2'){
      directTab = $('.payment_tab.slick-slide[data-pay_group="'+ group_name +'"]');
      directTab.find('strong.payment-nav_price').text(price + ' ' + currency);
    }
  };
  this.reloadPrice = function(){
    if(!this.hasPaymentSystems()) return false;
    var paymentSystem = this.getActivePaymentSystem(),
        currency = paymentSystem.getCurrency(),
        defaultCurrency = this.getDefaultCurrency(),
        rate = paymentSystem.getRate(),
        cost = this.willBeCharged(); // завжди отримуємо ціну у валюті сайту
        cost = parseFloat(cost);
        clear_cost = cost; // ціна без додаткових послуг
        markup_commission = false;
    //аде якщо валюта плат.системи не співпадає з валютою сайту проводимо конвертацію
    if(!paymentSystem.isCurrencyEquals(defaultCurrency)){
      clear_cost = cost = (cost / rate);
    }

    if (typeof avia_sub_total != 'undefined') {
      avia_sub_total.setCurrency(currency);
      avia_sub_total.setDecimalPrecision(this.getDecimalPrecision(currency));
      avia_sub_total.reloadTicketPrice(clear_cost);
    }

    //якщо доступний клас PriceCalculationObj
    if(this.hasCalculationService()){
      //отримуємо усі доступні додаткові сервіси
      var services = this.getAdditionalServices();
      services.forEach(function(service){
        service.reloadCost();
        if(!isNaN(service.selfPrice) && service.selfPrice > 0){
          cost += service.selfPrice; //додаємо вартість послуг сервісу до початкової ціни
        }
      });
      cost -= this.getAdditionalServicesCost(true);
    }
    //якщо є інші типи карт зі знижками
    if($('.select_select.payment_markups:visible').length > 0){
      var bonus_fake = this.getMarkupBonus();
      cost = cost + bonus_fake;
      clear_cost = clear_cost + bonus_fake;
      clear_cost = window.ceilNumber(clear_cost, this.getDecimalPrecision(paymentSystem.getCurrency()),true);
      var commission = paymentSystem.getDataDefault('commission');
      var tariff = paymentSystem.getDataDefault('tariff');
      var tax = paymentSystem.getDataDefault('tax');
      var hide_comm = $('#payment_markups_hide_discount').val();
      if(!parseInt(hide_comm)){
        if(paymentSystem.getDataDefault('has_sale')) commission = -commission;
        commission += bonus_fake;
      }else{
        tax += bonus_fake;
        if(tax < 0){
          tariff += tax;
          tax = 0;
        }
        tax = window.ceilNumber(tax, this.getDecimalPrecision(paymentSystem.getCurrency()),true);
        tariff = window.ceilNumber(tariff, this.getDecimalPrecision(paymentSystem.getCurrency()),true);
      }
      if(window['front_version'] == 'mobile'){
        commission = window.ceilNumber(commission, this.getDecimalPrecision(paymentSystem.getCurrency()),true);
        paymentSystem.setData('commission',commission);
        paymentSystem.setData('tarif',tariff);
        paymentSystem.setData('tax',tax);
        paymentSystem.setData('topay',clear_cost);
      }else{
        if(window['front_version'] == 'v2'){
          if(commission < 0){
            $('[data-payment-data="commission"]:visible').removeClass('plus').addClass('discount');
          }else{
            $('[data-payment-data="commission"]:visible').removeClass('discount').addClass('plus');
          }
        }
        if(!parseInt(hide_comm)) $('[data-payment-data="tax"]:visible').find('span').html(commission < 0 ? '-' : '+');
        commission = window.ceilNumber(Math.abs(commission), this.getDecimalPrecision(paymentSystem.getCurrency()),true);
        markup_commission = commission;
        paymentSystem.setData('commission',commission);
        paymentSystem.setData('tarif',tariff);
        paymentSystem.setData('tax',tax);
        paymentSystem.setData('topay',clear_cost);
        this.reloadPriceInTab(clear_cost,currency,paymentSystem.getGroupName());
      }
      $('.pay_aircompany_type').find('[data-payment_system_id="'+paymentSystem.id+'"]').find('strong').html(clear_cost + " " + currency);
    }
    if($('.payment-box.terminals_ul:visible').length > 0){
      var default_tax = paymentSystem.getDataDefault('tax');
      var default_commission = paymentSystem.getDataDefault('commission');
      var default_topay = window.ceilNumber(paymentSystem.getDataDefault('topay'), this.getDecimalPrecision(paymentSystem.getCurrency()),true);
      this.reloadPriceInTab(default_topay,currency,paymentSystem.getGroupName());
      if(window['front_version'] == 'v2'){
        default_commission = window.ceilNumber(Math.abs(default_commission), this.getDecimalPrecision(paymentSystem.getCurrency()),true);
        default_tax = window.ceilNumber(Math.abs(default_tax), this.getDecimalPrecision(paymentSystem.getCurrency()),true);

        paymentSystem.setData('tax',default_tax);
        paymentSystem.setData('commission',default_commission);
        paymentSystem.setData('topay',default_topay);

        if(commission < 0){
          $('[data-payment-data="commission"]:visible').removeClass('discount').addClass('plus');
        }else{
          $('[data-payment-data="commission"]:visible').removeClass('plus').addClass('discount');
        }
      }
    }

    var price = cost;
    price = window.formatNumber(cost, 2);
    if(window['front_version'] == 'v2' && $('#up_ad_text_js').length > 0){
      var ps_block_param = $('.payment_system[data-payment_system_id='+paymentSystem.id+']').data('params');
      var ps_controller = $('.payment_block').controller();
      ps_controller.additionalPricesSet('price',$('#up_ad_text_js').data('price'),price);
      ps_controller.additionalPricesSet('tariff',$('#up_ad_text_js').data('tariff'),ps_block_param.body.default_tariff);
      ps_controller.additionalPricesSet('taxes',$('#up_ad_text_js').data('taxes'),ps_block_param.body.default_tax);
      if(!markup_commission){
        ps_controller.additionalPricesSet('comm',$('#up_ad_text_js').data('comm'),-ps_block_param.body.default_commission);
      }else{
        ps_controller.additionalPricesSet('comm',$('#up_ad_text_js').data('comm'),-markup_commission);
      }
      if(ps_block_param.body.default_additional_services != undefined && ps_block_param.body.default_additional_services > 0){
        ps_controller.additionalPricesSet('additional_services',$('#up_ad_text_js').data('additional_services'),ps_block_param.body.default_additional_services);
      }
      if(ps_block_param.body.default_insurance != undefined && ps_block_param.body.default_insurance > 0){
        ps_controller.additionalPricesSet('insurance',$('#up_ad_text_js').data('insurance'),ps_block_param.body.default_insurance);
      }
    }
    if(window['front_version'] != 'v2' && window['front_version'] != 'mobile' && window.cur_domain == 'my'){
      for (var i = window['currencies'].length - 1; i >= 0; i--) {
        if(this.exchangeData[window['currencies'][i]] != undefined){
          $('.cabinet_tickets_details .text. strong.price.'+window['currencies'][i]).html(this.formatNumber(this.exchangeRate(window['currencies'][i],currency)*cost,window['currencies'][i])+"&nbsp;"+window['currencies'][i]);
        }
      }
    }
    this.updateBookingPrice(price, currency);
    this.reloadBonuses();
  };
  this.formatNumber = function(number,currency){
    var decimalPrecision = this.getDecimalPrecision(currency);
    return window.ceilNumber(number, decimalPrecision, true);
  };
  this.updateBookingPrice = function(price, currency){
    if(window['front_version'] == 'mobile'){
      var booking_price_button = $('.your-price');
      booking_price_button.find('strong').html(price + ' ' + currency);
    }else{
      var booking_price_button = $('.booking_price_button');  //TODO: memorize
      booking_price_button.find('strong').html("<em>"+price+"</em>" + ' ' + currency);
    }
  };
  this.setCalculationService = function(service){
    if(typeof service === 'object'){
      this.calculationService = service;
    }else{
      //console.warn('trying to set calculation service object, but it is not an object');
    }
  };
  this.getCalculationService = function(){
    return this.calculationService;
  };
  this.hasCalculationService = function(){
    return !(typeof this.calculationService === 'undefined');
  };
  this.explain = function(){
    var obj = {};
    obj['activePaymentSystemId'] = this.getActivePaymentSystemId();
    obj['paymentSystems'] = this.getPaymentSystems();
    obj['activeBlock'] = this.getActiveBlockElement();
    obj['bonusBlockElement'] = this.getBonusBlockElement();
    obj['bonusReward'] = this.bonusRule.getReward();
    obj['bonusCost'] = this.getBonusCost();
    obj['additionalBonusServices'] = this.getAdditionalBonusServices();
    obj['hasAdditionalBonusServices'] = this.hasAdditionalBonusServices();
    obj['additionalServices'] = this.getAdditionalServices();
    obj['allowedBonusServices'] = this.bonusRule.getAllowedServices();
    obj['additionalServicesCost'] = this.getAdditionalServicesCost();
    obj['bonusAmount'] = this.getBonusAmount();

    return obj;
  };
  this.reload = function(){
    if(this.hasPaymentSystems()){
      this.reloadPrice();
      this.reloadBonuses();
      this.updateWillBeCharged();
    }
  };
  /**
  * Повертає ціну без будь-яких додаткових послуг згідно валюти сайту
  */
  this.willBeCharged = function(){
    var bonusRule = this.getBonusRule();
    var promotionRule = this.getPromotionRule();
    var paymentSystem = this.getActivePaymentSystem();
    var defaultCurrency = this.getDefaultCurrency();
    var rate = paymentSystem.getRate();
    var cost = parseFloat(paymentSystem.getCostByDefaultCurrency(defaultCurrency)) + this.getAdditionalServicesCost(true)*rate;
    var insuranceCost = paymentSystem.getInsuranceCostByDefaultCurrency(defaultCurrency); // конвертує вартість згідно валюти сайту
    var willBeCharged = cost + insuranceCost;
    if( this.hasBonusRule() && $('#can_use_usblp_bonuses').length > 0 && this.useUsblpBonusesChecked() ){
        var usblp_bonuses_available = parseFloat( $('#can_use_usblp_bonuses').attr('data-usblp_bonuses_available') );
        var usblp_min_usable_bonuses = parseFloat( $('#can_use_usblp_bonuses').attr('data-usblp_min_usable') );

        var minimalPayment = bonusRule.getMinimalPayment();

        var payable_percent = 0.99;
        if(window.cur_domain == 'hotels'){
            payable_percent = 0.3;
        }

        if( minimalPayment.indexOf('%') != -1 ){
            minimalPayment = cost - cost*payable_percent
        }

        var services_with_min_payment_10_uah = ['events','insurance','hotels'];
        
        if( minimalPayment < 10 && services_with_min_payment_10_uah.indexOf(window.cur_domain) >=0 ){
            minimalPayment = 10;
        }else if(minimalPayment < 1){
            minimalPayment = 1;
        }

        if( usblp_bonuses_available >= usblp_min_usable_bonuses ){
            var max_bonus_payment = cost*payable_percent   // max allowed bonus payment payable_percent %, round down
            var max_allowed_bonus = cost - max_bonus_payment >= minimalPayment ? max_bonus_payment : cost - minimalPayment
            willBeCharged = (usblp_bonuses_available < max_allowed_bonus) ? (cost - usblp_bonuses_available) : cost - max_allowed_bonus;
        }

    }else if(this.hasBonusRule() && bonusRule.canUse() && paymentSystem.canUseBonus() && this.useBonusesChecked()){
      var availableBonus = bonusRule.getAvailableBonus();
      var minimalPayment = bonusRule.getMinimalPayment();
      if (typeof(minimalPayment) !== 'number' && minimalPayment.indexOf('%') >= 0) {
          minimalPayment = (cost*parseFloat(minimalPayment))/100;
      }
      var diff = (cost - availableBonus);
      willBeCharged = (diff > minimalPayment) ? diff : minimalPayment;
      if(paymentSystem.getGroupName() != 'aircompany' && paymentSystem.getGroupName() != 'direct'){
        willBeCharged = willBeCharged * paymentSystem.getAdditionalRate();
      }
    }else if(this.hasPromotionRule() && promotionRule.canUse() && paymentSystem.canUseBonus() && this.usePromotionChecked()){
      var minimalPayment = promotionRule.getMinimalPayment();
      if (typeof(minimalPayment) !== 'number' && minimalPayment.indexOf('%') >= 0) {
          minimalPayment = (cost*parseFloat(minimalPayment))/100;
      }
      var discount = this.usePromotionCost;
      var startPrice = willBeCharged;
      if (this.usePromotionPercentDiscount) {
        discount = (cost*parseFloat(discount))/100;
      }
      diff = (cost - discount);
      willBeCharged = (diff > minimalPayment) ? diff : minimalPayment;
      this.realPromotionCost = startPrice - willBeCharged;
    }
    if($('#up_ad_text_js').length > 0){
      if(window['front_version'] == 'v2' && this.usePromotionChecked()){
        $('.payment_block').controller().additionalPricesSet('promocodes',$('#up_ad_text_js').data('promocodes'), -this.realPromotionCost.toFixed(2));
      }
      if(window['front_version'] == 'v2' && (this.useBonusesChecked() || this.useUsblpBonusesChecked()) ){
        $('.payment_block').controller().additionalPricesSet('bonuses',$('#up_ad_text_js').data('bonuses'), ( willBeCharged - cost ).toFixed(2) );
      }else{
        $('.payment_block').controller().additionalPricesSet('bonuses',$('#up_ad_text_js').data('bonuses'),0);
      }
    }

    return willBeCharged;
  };
  /**
  * Визначає валюту для відображення в блоці will_be_charged (Рис.1)
  *
  * ATTENTION:
  * Якщо валюта плат.системи RUR, але реальна платіжна валюта EUR
  * В блоці will_be_charged відображатиметься валюта EUR,
  * в той час як валюта кінцевої ціни буде в RUR
  */
  this.getCurrencyForDisplay = function(paymentSystem){
    return (paymentSystem.getRealPayCurrency() !== this.getDefaultCurrency()) ? paymentSystem.getRealPayCurrency() : paymentSystem.getCurrency();
  }
  /**
  * Оновлює блок will_be_charged згідно реальної валюти плат.системи
  * +--------------------------------------+
  * | С Вашей карты будет списано:         |
  * |                                      |
  * | Компанией Tickets.ru     339 USD <------- реальна плат.валюта (real_pay_currency)
  * +--------------------------------------+
  *       Рис.1 Блок will_be_charged
  *
  */
  this.updateWillBeCharged = function(){

    var paymentSystem = this.getActivePaymentSystem();
    // var groupName = paymentSystem.getGroupName();
    // if(groupName == 'aircompany'){
      // return;
    // }

    var block = this.getActiveBlockElement();

    var element = block.find('.will_be_charged:visible');
    if(element.length){
      var cc_price = element.find('.cc_price');
      var additional_price = true;
      var willBeChargedAmount = this.willBeCharged();
      //TODO: добавити правило обробки цін до нас і в АК при використанні бонусів
      if(cc_price.length > 1){
        cc_price = cc_price.first(); //return false;
        if(!paymentSystem.isCurrencyEqualsRealPayCurrency()) additional_price = false;
        if($('[name=our_commission]')){
          willBeChargedAmount -= parseFloat($('[name=our_commission]').val());
        }
      }
      var target = cc_price.contents();
      var paymentSystem = this.getActivePaymentSystem();
      var currencyNode = target.last()[0];
      var rate = paymentSystem.getRate();
      var currency = this.getCurrencyForDisplay(paymentSystem);
      if($('.select_select.payment_markups:visible').length > 0){
        var bonus_fake = this.getMarkupBonus();
        willBeChargedAmount = willBeChargedAmount + bonus_fake;
      }
      willBeChargedAmount = (willBeChargedAmount / rate);
      var price = willBeChargedAmount;
      price = window.formatNumber(price, 2);//this.getDecimalPrecision(paymentSystem.getCurrency())
      target.first().text(price);
      this.updateTextNode(currencyNode, currency);
    }
  };
  this.setUseBonusesCheck = function(flag){
    this.useBonusesCheckedFlag = flag;

    this.reloadPrice();
    this.updateWillBeCharged();
  };
  this.useBonusesChecked = function(){
    return this.useBonusesCheckedFlag;
  };
  this.setUsePromotionCheck = function(flag){
    this.usePromotionCheckedFlag = flag;
    this.reloadPrice();
    this.updateWillBeCharged();
  };
  this.usePromotionChecked = function(){
    return this.usePromotionCheckedFlag;
  }

  /**
   * USBLP bonuses calculation
   */
  this.setUsblpUseBonusesCheck = function(flag){
    this.useUsblpBonusesCheckedFlag = flag;

    this.reloadPrice();
    this.updateWillBeCharged();
  };
  this.useUsblpBonusesChecked = function(){
    return this.useUsblpBonusesCheckedFlag;
  }

  /**
  * Кіл-ть знаків для заокруглення сум для певного сервісу
  *
  * Детальніше:
  * # modules/payment/config/payment_block
  * $config['decimal_ceil_currencies']
  *
  * @return integer
  */
  this.getDecimalPrecision = function(currency){
    if(typeof this.decimalPrecisions == 'undefined'){
      this.decimalPrecisions = $('.way_th').data('decimal-precisions') || false;
    }
    var prec = 2;
    if(typeof this.decimalPrecisions == 'object'){
      if(this.decimalPrecisions[currency]){
        prec = 0;
      }
    }else if(this.decimalPrecisions){
      prec = 0;
    }
    return prec;
  };
  this.getDefaultCurrency = function(){
    if(typeof this.defaultCurrency == 'undefined'){
      this.defaultCurrency = $('.way_th').data('default-currency');
    }
    return this.defaultCurrency;
  };
  this.getDefaultCurrencyShort = function(){
    if(typeof this.defaultCurrencyShort == 'undefined'){
      this.defaultCurrencyShort = $('.way_th').data('default-currency-short');
    }
    return this.defaultCurrencyShort;
  }
  /**
  * NOTICE: ie8 doesn't support textContent
  * <div><span>hello</span>UPDATEME</div>
  */
  this.updateTextNode = function(node, value){
    var value = value || '';
    if(typeof(node) != 'undefined'){
      var prop = (typeof(node.textContent) == 'undefined') ? 'nodeValue' : 'textContent';
      node[prop] = ' '+value;
    }
  };

  this.setPromotionCost = function(amount, is_percent) {
    this.usePromotionCost = parseFloat( amount );
    this.realPromotionCost = 0;
    this.usePromotionPercentDiscount = is_percent;
    this.updateWillBeCharged();
    this.reloadBonuses();
  };

  this.usePromotion = function(){
    return this.usePromotionCost > 0;
  };
  this.getMarkupBonus = function(id){
    var bonus_fake = 0;
    if(id != undefined){
      var mdata = $('#markups_'+id).data('payment_markups');
    }else{
      if($('.select_card_type.markup_block:visible').length > 0 ){
        var bonus_fake = $('.select_select:visible').find('select.markups_js').val();
      }else if($('.markup_card_type:checked:visible').length > 0){
        var bonus_fake = $('.markup_card_type:checked:visible').val();
      }else if($('.markups_js:visible').length > 0){
        var mdata = $('.markups_js:visible').data('payment_markups');
      }
    }
    if(mdata != undefined){
      bonus_fake = mdata[0].old_markup;
      $(mdata).each(function(){
        if(this.display) bonus_fake = this.old_markup;
      });
    }
    return window.ceilNumber(parseFloat(bonus_fake),2);
  };
  this.getClientStorage = function()
  {
    var storage = $('#client_storage').data('storage');
    return storage;
  };
  //@jira PS-1532
  this.hideCalculationBlock = function()
  {
    var storage = this.getClientStorage();
    
    if(storage && storage.configs && storage.configs.hide_calculation_block){
      $('.price-table').hide();
      $('dl.way_name_row').children().hide();
    }
  }
};
