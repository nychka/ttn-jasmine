describe("CreditCard", function(){
	it("cleans number by removing spaces and dashes", function(){
		var card = new CreditCard();
		expect(card.cleanNumber("123 4-5")).toEqual("12345");
	});
	it("validates when text field is empty", function(){
		loadFixtures("card_form.html");
		var form_validator = $('form').validate();
		var card_number = $('#card_number');
		card_number.val('');
		expect($('form').valid()).toBeFalsy();
		expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number. VISA or MasterCard');
	});
	it("validates when text field starts with 41", function(){
		loadFixtures("card_form.html");
		var form_validator = $('form').validate();
		var card_number = $('#card_number');
		card_number.val('4168');
		expect($('form').valid()).toBeTruthy();
	});
	it("validates real card when text field is empty", function(){
		loadFixtures("real_card.html");
		var form_validator = $('form').validate();
		var card_number = $('#card_number_0');
		card_number.val('');
		expect($('form').valid()).toBeFalsy();
		expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number. VISA or MasterCard');
	});
	it("validates real card when text field starts with 51", function(){
		loadFixtures("real_card.html");
		var form_validator = $('form').validate();
		var card_number = $('#card_number_0');
		$('#card_number_1').val('7572');
		$('#card_number_2').val('4168');
		$('#card_number_3').val('9712');
		card_number.val('5168');
		expect($('form').valid()).toBeTruthy();
	});
	it("has label from 16 to 18 signs", function(){
		loadFixtures("maestro_momentum.html");
		var text = $('.card-number:visible label').text();
		expect(text).toEqual('Номер карты (от 16 до 18 цифр)');
	});
});