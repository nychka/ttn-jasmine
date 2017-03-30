function PromotionRule(data){
  this.init = function(data){
    this.data = data;
    this.minimalPayment = data.minimal_payment;
  };
  this.canUse = function(){
    return this.data.can_use;
  };
  this.getMinimalPayment = function(){
    return this.data.minimal_payment;
  };
  this.init(data);
};