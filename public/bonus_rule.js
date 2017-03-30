function BonusRule(data){
  this.init = function(data){
    this.data = data;
    //console.log(data);
    this.reward = data.reward;
    this.minimalPayment = data.minimal_payment;
    this.necessaryMinimum = data.necessary_minimum;
  };
  this.canUse = function(){
    return this.data.can_use;
  };
  this.getAvailableBonus = function(){
    return this.data.available_bonus || 0;
  };
  this.getMinimalPayment = function(){
    return this.data.minimal_payment;
  };
  this.getReward = function(){
    return this.data.reward;
  };
  this.getAllowedServices = function(){
    return this.data.allowed_services;
  }
  this.init(data);
};