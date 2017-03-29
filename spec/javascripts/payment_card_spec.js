/*
 TODO:
 - створити тест-кейси
 - підготувати середовище
 */
describe("PaymentCard", function(){
    it("has label from 16 to 18 signs", function(){
        loadFixtures("maestro_momentum.html");
        var text = $('.card-number:visible label').text();
        expect(text).toEqual('Номер карты (от 16 до 18 цифр)');
    });
    it('has 4 card blocks', function(){
        loadFixtures('maestro_momentum.html');
        var blocks = $('.way_description_block_aircompany .card_num');
        expect(blocks.length).toEqual(4);
    });
    describe('Default Validation', function(){
        it('form is not valid cardholder, month, year and cvv are empty', function(){
            loadFixtures('maestro_momentum.html');
            var active_block = $('.card_number:visible');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('5168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('4168');
            $('#card_number_3').val('9712');

            expect(form.valid()).toBeFalsy();
            // debugger;
            expect(form_validator.errorList.length).toEqual(4);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');

            expect(form_validator.errorList[1].element).toHaveId('card_date_year');
            expect(form_validator.errorList[1].message).toEqual('This field is required.');

            expect(form_validator.errorList[2].element).toHaveId('card_holder');
            expect(form_validator.errorList[2].message).toEqual('This field is required.');

            expect(form_validator.errorList[3].element).toHaveId('card_cvv');
            expect(form_validator.errorList[3].message).toEqual('This field is required.');
        });
        it('validates first card number with invalid card type 3168', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('3168');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(5);
            expect(form_validator.errorList[0].element).toHaveId('card_number_0');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
        });
        it('validates first card number with card type VISA 4168', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(4);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates date month with invalid number 13', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_year').val(20);
            $('#card_date_month').val(13);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(3);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid expiration date.');
        });
        it('validates date year with invalid expiration date', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            var card_date_year = $('#card_date_year');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            card_date_year.val(16);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(3);
            expect(form_validator.errorList[0].element).toHaveId('card_date_year');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid expiration date.');
        });
        it('validates card holder with with empty string', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            var card_date_year = $('#card_date_year');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            card_date_year.val(20);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(2);
            expect(form_validator.errorList[0].element).toHaveId('card_holder');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        xit('validates card holder with with numbers', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            var card_date_year = $('#card_date_year');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            card_date_year.val(20);
            $('#card_holder').val('34');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(2);
            expect(form_validator.errorList[0].element).toHaveId('card_holder');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates card cvv with with empty string', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(1);
            expect(form_validator.errorList[0].element).toHaveId('card_cvv');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates card cvv with with invalid number 12', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');
            $('#card_cvv').val(12);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(1);
            expect(form_validator.errorList[0].element).toHaveId('card_cvv');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
        });
        it('validates form with correct data', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');
            $('#card_cvv').val(123);

            expect(form.valid()).toBeTruthy();
            expect(form_validator.errorList.length).toEqual(0);
        });
    });
    describe('Maestro Momentum', function(){
        it('checks card wrapper', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.wrapper).toExist();
        });
        it('checks card input wrapper', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.cardInputWrapper).toExist();
        });
        it('::getNumberInputs()', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.getNumberInputs().length).toEqual(4);
        });
        it('::getCount() with 0', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.getCount()).toEqual(0);
        });
        it('::getCount() with 4', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            $('#card_number_0').val(1234);
            expect(card.getCount()).toEqual(4);
        });
        it('::numberStarts() with 63', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.numberStarts('63')).toBeTruthy();
        });
        it('::hasAdditionalInput() when is not active', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.hasAdditionalInput()).toBeFalsy();
        });
        it('::addNumberInput', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            var input = card.addNumberInput();
            expect(input).toHaveId('card_number_4');
            expect($('#card_number_4')).not.toExist();
        });
        it('::numberStarts() with 63', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.numberStarts('63')).toBeTruthy();
        });
        it('::numberStarts() with 63', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            expect(card.numberStarts('63')).toBeTruthy();
        });
        it('::getFirstInput', function(){
            loadFixtures('maestro_momentum.html');
            var card = new PaymentCard();
            var input = card.getFirstInput();
            expect(input).toBeInDOM();
            expect(input).toHaveId('card_number_0');
        });
        describe('when active', function(){
            it('appends additional input with XX placeholder', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                expect($('#card_number_4')).toExist();
            });
            it('has additional input', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                expect(card.hasAdditionalInput()).toBeTruthy();
            });
            it('card holder not required', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                var card_holder = $('#card_holder');
                expect(card_holder).not.toHaveAttr('required');
                expect(card_holder.valid()).toBeTruthy();
                expect($('#card_holder_not_required')).toBeInDOM();
                expect($('#card_holder_not_required')).toBeVisible();
            });
            it('adds validation rule for first input', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                var first_input = card.getFirstInput();
                expect(first_input).toHaveClass('valid_card_number_maestro_momentum');
                expect(first_input).not.toHaveClass('valid_card_number');
                expect(first_input).not.toHaveClass('valid_card_number_visa_master');
            });
            xit('fixes tab index', function(){
                //TODO:
            });
            xit('prepares validation rule for jquery validator plugin', function(){
                //TODO:
            })
        });
        describe('when unactive', function(){
           it('card holder is required', function(){
               loadFixtures('maestro_momentum.html');
               var card = new PaymentCard();
               card.whenUnactive();
               expect($('#card_holder')).toHaveAttr('required');
           });
            it('card holder text is hidden', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenUnactive();
                expect($('#card_holder_not_required')).not.toBeVisible();
            });
            it('removes validation rule from first input', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenUnactive();
                expect($('#card_number_0')).not.toHaveClass('valid_card_number_maestro_momentum');
                expect($('#card_number_0')).toHaveClass('valid_card_number');
                expect($('#card_number_0')).toHaveClass('valid_card_number_visa_master');
            });
            it('hides additional card number input', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                card.whenUnactive();
                var input = card.getAdditionalInput();
                expect(input).toBeInDOM();
                expect(input).not.toBeVisible();
            });
            it('clears additional card number input value', function(){
                loadFixtures('maestro_momentum.html');
                var card = new PaymentCard();
                card.whenActive();
                var input = card.getAdditionalInput();
                input.val('foo');
                card.whenUnactive();
                expect(input).toBeInDOM();
                expect(input).not.toBeVisible();
                expect(input).toHaveValue('');
            });
        });

        xit('validates first card number with 63', function(){
            loadFixtures('maestro_momentum.html');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('6311');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('4168');
            $('#card_number_3').val('9712');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(4);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
        });
    });
});
