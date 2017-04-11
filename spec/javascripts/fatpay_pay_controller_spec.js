describe('Fatpay_PayController', function(){
	beforeEach(function(){
		loadFixtures('fatpay.html');
	});
	describe('Intro', function(){
		it('has controller', function(){
			var controller = $('.all_pages').controller();

			expect(typeof controller === 'object').toBeTruthy();
			expect(controller.events).not.toBeEmpty();
		});
		it('has momentum title', function(){
			var wrapper = $('.card_block'),
			title = wrapper.find('strong:first');

			expect(title.text()).toEqual('Номер карты (от 16 до 18 цифр)');
		});
		it('has card wrapper', function(){
			expect($('.card_block')).toBeInDOM();
		});
		it('has card number wrapper', function(){
			expect($('.card_number')).toBeInDOM();
		});
		it('has 5 card number inputs', function(){
			var wrapper = $('.card_number'),
			inputs = wrapper.find('input');

			expect(inputs).toBeInDOM();
			expect(inputs.length).toEqual(5);
		});
		it('has 9 card inputs: 5 card inputs + 1 month + 1 year + 1 card_holder + 1 cvv', function(){
			var wrapper = $('.card_block'),
			inputs = wrapper.find('input[tabindex]');

			expect(inputs).toBeInDOM();
			expect(inputs.length).toEqual(9);
		});
		it('has card_holder wrapper', function(){
			var wrapper = $('.card_block'),
			card_holder_wrapper = wrapper.find('.card_owner');

			expect(card_holder_wrapper).toBeInDOM();
		});
		it('has label #card_holder_not_required', function(){
			var wrapper = $('.card_block'),
			card_owner = wrapper.find('.card_owner'),
			label = card_owner.find('#card_holder_not_required');

			expect(label).toBeInDOM();
		});
		it('has cvv wrapper', function(){
			var wrapper = $('.card_block'),
			cvv_wrapper = wrapper.find('.card_cvv');

			expect(cvv_wrapper).toBeInDOM();
		});
		it('has link #if_you_have_cvv', function(){
			var wrapper = $('.card_block'),
			link = wrapper.find('#if_you_have_cvv');

			expect(link).toBeInDOM();
		});
	});
	describe('States', function(){
		describe('Default', function(){
                beforeEach(function(){
                	this.card = new PaymentCard();
                    this.card.transitToState('default');
                    this.context = this.card.getContext();
                });
                describe('card_number_4: extra input', function(){
                    it('is hidden', function(){
                        expect(this.context.card_number_4).not.toBeVisible();
                    });
                    it('is disabled', function(){
                        expect(this.context.card_number_4).toHaveAttr('disabled');
                    });
                    it('is empty', function(){
                        expect(this.context.card_number_4.val()).toEqual('');
                    });
                });
                describe('card_holder', function(){
                    it('is required', function(){
                        expect(this.context.card_holder).toHaveAttr('required');
                        expect(this.context.card_holder.prop('required')).toBeTruthy();
                    });
                    it('is visible', function(){
                        expect(this.context.card_holder).toBeVisible();
                    });
                    it('is not disabled', function(){
                        expect(this.context.card_holder).not.toHaveAttr('disabled');
                        expect(this.context.card_holder.prop('disabled')).toBeFalsy();
                    });
                });
                describe('card_cvv', function(){
                    it('is required', function(){
                        expect(this.context.card_cvv).toHaveAttr('required');
                        expect(this.context.card_cvv.prop('required')).toBeTruthy();
                    });
                    it('is visible', function(){
                        expect(this.context.card_cvv).toBeVisible();
                    });
                    it('is not disabled', function(){
                        expect(this.context.card_cvv).not.toHaveAttr('disabled');
                        expect(this.context.card_cvv.prop('disabled')).toBeFalsy();
                    });
                });
                describe('card cvv wrapper - .card_owner', function(){
                    it('is visible', function(){
                        expect(this.context.wrapper.find('.card_owner')).toBeVisible();
                    });
                });
                describe('link #if_you_have_cvv', function(){
                    it('is hidden', function(){
                        expect(this.context.wrapper.find('#if_you_have_cvv')).not.toBeVisible();
                    });
                });
                describe('card holder label #card_holder_not_required', function(){
                    it('is hidden', function(){
                        expect(this.context.wrapper.find('#card_holder_not_required')).not.toBeVisible();
                    });
                });
            });
	});
});