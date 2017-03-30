function PaymentSystem(data){

  this.init = function(data){
    this.data = data;
    this.id = data.head.payment_system_id;
  };
  this.getDataDefault = function(type){
    return this.data.body['default_'+type];
  };
  this.setData = function(type,value){
    var row = $('.way_name_row.active')
    if(window['front_version'] == 'mobile'){
      row.find('[data-payment-data="'+type+'"]').html(value + ' ' + this.getCurrency());
    }
    else if(window['front_version'] == 'v2'){
      if(type == 'topay'){
        row.find('[data-payment-data="'+type+'"]').html(value + ' ' + this.getCurrency());
      }else{
        row.find('[data-payment-data="'+type+'"]').html(value);
      }
    }
    else {
      row.find('[data-payment-data="'+type+'"]').find('strong').html(value + ' ' + this.getCurrency());
    }
  };
  this.getId = function(){
    return this.id;
  };
  this.getCurrency = function(){
    return this.data.head.currency_short;
  };
  this.getGroupName = function(){
    return this.data.head.payment_type;
  };
  this.getCost = function(){
    return parseFloat(this.data.head.cost);
  };
  this.canUseBonus = function(){
    return this.data.bonus && this.data.bonus.can_use;
  };
  this.getRate = function(){
    var rate = this.data.head.rate_against_default_currency;
    return parseFloat(rate);
  };
  this.getRealPayCurrency = function(){
    return this.data.head.real_pay_currency;
  };
  this.isCurrencyEqualsRealPayCurrency = function(){
    return this.data.head.real_pay_currency === this.data.head.currency;
  };
  this.isCurrencyEquals = function(currency){
    return this.data.head.currency === currency;
  };
  this.getInsuranceCost = function(){
    return this.data.head.insurance_cost ? parseFloat(this.data.head.insurance_cost) : 0;
  }
  this.getAdditionalRate = function(){
    var cost = this.getCost();
    var base_cost = 1;
    if($('#base_amount') != 'undefined'){
      base_cost = $('#base_amount').val();
    }
    return cost/base_cost;
  }
  this.getCostByDefaultCurrency = function(currency, originalCost){
    var rate = this.getRate();
    var cost = originalCost ? this.getOriginalCost() : this.getCost();
    // if($('#base_amount') != 'undefined' && $('.payment_block').controller() != undefined && $('.payment_block').controller().cost.useBonusesChecked() && this.getGroupName() != 'aircompany' && this.getGroupName() != 'direct'){
    //   cost = $('#base_amount').val();
    // }
    return this.isCurrencyEquals(currency) ? cost : (cost * rate);
  };
  this.getInsuranceCostByDefaultCurrency = function(currency){
    var rate = this.getRate();
    var cost = this.getInsuranceCost();
    return this.isCurrencyEquals(currency) ? cost : (cost * rate);
  };
  this.getOriginalCost = function(){
    return this.data.head.original_cost ? parseFloat(this.data.head.original_cost) : this.getCost();
  }

  this.init(data);
};
