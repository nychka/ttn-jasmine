function CreditCard()
{
	this.cleanNumber = function(number){
		return number.replace(/[\W\-]/g, "");
	};
	this.validNubmer = function(number){
		return number;
	};
};