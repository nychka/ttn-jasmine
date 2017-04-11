describe('Fatpay_PayController', function(){
	beforeEach(function(){
		loadFixtures('fatpay.html');
		this.settings = {
			card_wrapper:               '.card_block',
			card_input_wrapper:         '.card_number',
			first_input:                '#post_card_number_1',
			card_number_0:              this.first_input,
			card_number_1:              '#post_card_number_2',
			card_number_2:              '#post_card_number_3',
			card_number_3:              '#post_card_number_4',
			card_number_4:              '#post_card_number_5',
			card_date_month:            '#post_month',
			card_date_year:             '#post_year',
			card_holder:                '#post_owner',
			card_cvv:                   '#post_cvv',
			card_holder_wrapper:        '.card_owner',
			card_cvv_wrapper:           '.card_cvv',
			card_holder_not_required:   '#card_holder_not_required',
			if_you_have_cvv:            '#if_you_have_cvv'
		};
	});
	describe('Intro', function(){
		it('has controller', function(){
			var controller = $('.all_pages').controller();

			expect(typeof controller === 'object').toBeTruthy();
			expect(controller.events).not.toBeEmpty();
		});
		it('has momentum title', function(){
			var wrapper = $(this.settings.card_wrapper),
			title = wrapper.find('strong:first');

			expect(title.text()).toEqual('Номер карты (от 16 до 18 цифр)');
		});
		it('has card wrapper', function(){
			var wrapper = $(this.settings.card_wrapper);

			expect(wrapper).toBeInDOM();
		});
		it('has card number wrapper', function(){
			var wrapper = $(this.settings.card_input_wrapper);

			expect(wrapper).toBeInDOM();
		});
		it('has 5 card number inputs', function(){
			var wrapper = $(this.settings.card_input_wrapper),
			inputs = wrapper.find('input');

			expect(inputs).toBeInDOM();
			expect(inputs.length).toEqual(5);
		});
		it('has 9 card inputs: 5 card inputs + 1 month + 1 year + 1 card_holder + 1 cvv', function(){
			var wrapper = $(this.settings.card_wrapper),
			inputs = wrapper.find('input[tabindex]');

			expect(inputs).toBeInDOM();
			expect(inputs.length).toEqual(9);
		});
		it('has card_holder wrapper', function(){
			var card_holder_wrapper = $(this.settings['card_holder_wrapper']);

			expect(card_holder_wrapper).toBeInDOM();
		});
		it('has label #card_holder_not_required', function(){
			var label = $(this.settings['card_holder_not_required']);

			expect(label).toBeInDOM();
		});
		it('has cvv wrapper', function(){
			var cvv_wrapper = $(this.settings['card_cvv_wrapper']);

			expect(cvv_wrapper).toBeInDOM();
		});
		it('has link #if_you_have_cvv', function(){
			var link = $(this.settings['if_you_have_cvv']);

			expect(link).toBeInDOM();
		});
	});
	describe('PaymentCard', function(){
		beforeEach(function(){
			this.card = new PaymentCard(this.settings);
		});
		describe('Default', function(){
			beforeEach(function(){
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
					var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

					expect(this.context.wrapper.find(card_holder_wrapper)).toBeVisible();
				});
			});
			describe('link #if_you_have_cvv', function(){
				it('is hidden', function(){
					var link = this.card.settings['if_you_have_cvv'];

					expect(this.context.wrapper.find(link)).not.toBeVisible();
				});
			});
			describe('card holder label #card_holder_not_required', function(){
				it('is hidden', function(){
					var label = this.card.settings['card_holder_not_required'];

					expect(this.context.wrapper.find(label)).not.toBeVisible();
				});
			});
		});
		describe('Momentum Activated', function(){
            beforeEach(function(){
                this.card.transitToState('momentum_activated');
                this.context = this.card.getContext();
            });
            describe('card_number_4: extra input', function(){
                it('is visible', function(){
                    expect(this.context.card_number_4).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_number_4).not.toHaveAttr('disabled');
                });
            });
            describe('card_holder', function(){
                it('is not required', function(){
                    expect(this.context.card_holder).not.toHaveAttr('required');
                    expect(this.context.card_holder.prop('required')).toBeFalsy();
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
                    var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

                    expect(this.context.wrapper.find(card_holder_wrapper)).toBeVisible();
                });
            });
            describe('link #if_you_have_cvv', function(){
                it('is hidden', function(){
                    var link = this.card.settings['if_you_have_cvv'];

                    expect(this.context.wrapper.find(link)).not.toBeVisible();
                });
            });
            describe('card holder label #card_holder_not_required', function(){
                it('is visible', function(){
                    var label = this.card.settings['card_holder_not_required'];

                    expect(this.context.wrapper.find(label)).toBeVisible();
                });
            });
        });
        describe('Momentum Filled', function(){
            beforeEach(function(){
                this.card.transitToState('momentum_activated');
                this.card.transitToState('momentum_filled');
                this.context = this.card.getContext();
            });
            describe('card_number_4: extra input', function(){
                it('is visible', function(){
                    expect(this.context.card_number_4).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_number_4).not.toHaveAttr('disabled');
                });
            });
            describe('card_holder', function(){
                it('is hidden', function(){
                    expect(this.context.card_holder).not.toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_holder).not.toHaveAttr('disabled');
                    expect(this.context.card_holder.prop('disabled')).toBeFalsy();
                });
                it('has empty value', function(){
                    expect(this.context.card_holder.val()).toEqual('');
                });
            });
            describe('card_cvv', function(){
                it('is hidden', function(){
                    expect(this.context.card_cvv).not.toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_cvv).not.toHaveAttr('disabled');
                    expect(this.context.card_cvv.prop('disabled')).toBeFalsy();
                });
                it('is not empty', function(){
                    expect(this.context.card_cvv.val()).not.toEqual('');
                    expect(this.context.card_cvv.val()).toEqual('123');
                });
            });
            describe('card cvv wrapper - .card_owner', function(){
                it('is hidden', function(){
                    var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

                    expect(this.context.wrapper.find(card_holder_wrapper)).not.toBeVisible();
                });
            });
            describe('link #if_you_have_cvv', function(){
                it('is visible', function(){
                    var link = this.card.settings['if_you_have_cvv'];

                    expect(this.context.wrapper.find(link)).toBeVisible();
                });
            });
            describe('card holder label #card_holder_not_required', function(){
                it('is hidden', function(){
                    var label = this.card.settings['card_holder_not_required'];

                    expect(this.context.wrapper.find(label)).not.toBeVisible();
                });
            });
        });
	});
	describe('PayController', function(){
		beforeEach(function(){
			this.controller = $('.all_pages').controller();
		});
		it('supports card type: mastercard', function(){
			var card_type = $.payment.cardType('51');

			expect(card_type).toEqual('mastercard');
		});
		it('supports card type: maestro_momentum', function(){
			var card_type = $.payment.cardType('63');

			expect(card_type).toEqual('maestro_momentum');
		});
	});
});