$.Controller("V2AviaBookingController", "IntermediateAviaBookingController", {
  init:function(){
    $.extend($.validator.messages, validation_errors);
    this.setup_validation();
    this.nationalities = typeof(nationalities) != "undefined" ? nationalities : [];
    this.hide_charge_popup = false;
    if(this.element.data('country')){
      this.set_nationality();
    }
    this.setup_events();
    if ( $('.js-splited-date').length > 0 ) new DateInput(this).createSplitedDateInput();
    else new DateInput(this).createDateInput();
    if(is_table){
      this.off_input_correct();
    }
    this.set_filter_paste();
    this.return_back_after_logout();
    window.enable_popups();
    this.fix_skype_link();
    this.set_before_unload();
    this.set_docnum_validation_as_to_nationality();
    this.check_agreement_checkbox_visibility();
    this.setup_s7_event();

    if(pb_ancillary_services.length > 0 && typeof ancillaryServicesObj != "undefined")
      this.fill_ancillary_services();
  },
  // EVENTS START
  // "input[type=submit] -> click":function(ev){
  //   ev.preventDefault();
  // },

  "[id *= 'citizenship_'] .chosen-search -> keypress":function(ev) {
    setTimeout(function(){
      if($(ev.target).parent().siblings('.chosen-results') && $(ev.target).parent().siblings('.chosen-results').find('.active-result').length == 1){
        var index = parseInt($(ev.target).parent().siblings('.chosen-results').find('.active-result:first').data('option-array-index'));
        var select = $(ev.target).parents('.chosen-container').siblings('.js-nationality-select');

        select.val($(select[0][index]).attr('value')).trigger('chosen:updated');
        select.change();
        $('.js-users-data').click();
      }
    }, 200 );
  },
  ".tab_gender_select -> ifChecked":function(ev) {
    var p_div = this.element.find(ev.target).parents('.js-gender-list:has(.error)');
    if(p_div.length > 0){
      p_div.removeClass('error');
      this.rm_tooltip(p_div.find('input:first'));
    }
  },
  ".js-nationality-select -> change":function(ev) {
    $(ev.target).siblings(".hidden_nationality").val($(ev.target).val()).change();
    this.init_international_validation($(ev.target).val(), $(ev.target));
    if($('.URC_attention_block').length > 0) this.check_nationality();
  },
  ".js-bonus-checker -> change":function(el){
    var el = $(el.target);
    var input = this.element.find('#bonus_card_'+el.data('key'));
    input.removeClass("error")
    input.siblings('.error').remove();
    if(el.is(":checked")){
      input.removeAttr('disabled');
      el.val('1');
    }else{
      input.attr('disabled','disabled');
      el.val('0');
    }
  },
  ".js-expiration-checker-new -> change": function(ev){
    if($(ev.target).is(':checked')){
      $(ev.target).parents('.db-col').find('.js-splited-date.js-doc-expire').find('input').removeAttr('disabled');
    }else{
      $(ev.target).parents('.db-col').find('.js-splited-date.js-doc-expire').find('input').attr('disabled', 'disabled').removeClass('error').siblings('samp.error').remove();
    }
  },

  // EVENTS END
  // FUNCTION START
  get_text_from_clipboard_by_event: function(e){
    if(window.clipboardData){
      var clipboard = window.clipboardData || false,
        text = (clipboard)?window.clipboardData.getData("Text"):false;
    }else{
      var clipboard = (e.originalEvent || e).clipboardData || false,
        text = (clipboard)?clipboard.getData('text/plain'):false;
    }
    return text;
  },
  set_filter_paste:function(){
    var self = this;
    $('.js-filter-paste').bind('paste',function(e){
      var text = self.get_text_from_clipboard_by_event(e);
      if(text){
        e.preventDefault();
        var char_list = window.getTranslitObject();
          char_list_keys = Object.keys(char_list).join(""),
          regex_input = new RegExp("[^a-zA-Z"+char_list_keys+"\\-\\s]", 'gi'),
          regex_replace = new RegExp('['+char_list_keys+']',"gi"),
          el = $(this),
          pos = el.caret(),
          array_from_str = el.val().split(''),
          formated = text.replace(regex_input, "")
          if(!hidden_translit) formated = formated.replace(regex_replace, function(matched){return char_list[matched]});

          if(pos.begin != pos.end){
            array_from_str.splice(pos.begin, pos.end-pos.begin, formated);
            var final_caret_pos = pos.end - ((pos.end-pos.begin) - formated.length);
          }else{
            array_from_str.splice(pos.begin, 0, formated)
            var final_caret_pos = pos.begin + formated.length;
          }

          el.val(array_from_str.join(''));
          el.caret(final_caret_pos);
      }
    });
  },
  fix_skype_link:function(){
    var self = this;
    $('.skype').click(function(){
      $(window).unbind('beforeunload');
      setTimeout(function(){
        self.set_before_unload();
      }, 200);
    });
  },
  set_before_unload:function(){
    $(window).bind('beforeunload', this.beforeunload_from_page);
  },

  beforeunload_from_page:function(){
  },

  off_input_correct:function(){
    $('.js-off-correct').attr('autocomplete', 'off').attr('autocorrect', 'off').attr('spellcheck', 'off');
  },

  set_nationality:function(){
    var country = this.element.data('country'),
    self = this;
    this.element.find(".js-nationality-select").each(function(){
      $(this).val(country.code.toUpperCase()).trigger('chosen:updated');
      $(this).change();
      $('#js-pre-booking-form').click();
      self.init_international_validation(country.code.toUpperCase(), $(this));
      self.set_docnum_validation_for_ru(this);
    });
  },
  set_tooltip:function(el,text,scroll){
    //if($('.b_errors').is(':visible')) return false;
    scroll = scroll || false;
    var inputs = this.element.find("input:visible:not(:disabled)").add('.ui-helper-hidden-accessible');
    var idx  = inputs.index(el);

    var self = this;
    var scroll_to_error = (this.validator_instance.errorList.length > 0 && $(this.validator_instance.errorList[0].element).attr('name') == el.attr('name'));
    el =  el.hasClass("i_accept_chk") ? el.parents(".i_accept").addClass("accept-error") : el;
    if(el.hasClass('tab_gender_select')){
      var p_div = el.parents('.js-gender-list');
      el = p_div;
    }

    setTimeout(function(){
      if(el.val().length > 0 && el.parents('.js-splited-date').length > 0) el.parents('.js-splited-date').find('input').addClass('error');
    },10)
    if($("samp.error:visible").length !== 0) return false;
    if(!$("._idx_" + idx).size()){
      window.show_error_popup(el,text,idx,true);
    }
    $('samp.error:eq(0)').removeClass('hidden');
    $('samp.error:visible:gt(0)').addClass('hidden');
    if($(".error").length > 0 && (scroll_to_error || (this.validator_instance.errorList.length == 0 && scroll))){
      // if(self.scroll_to_error){
        self.scroll_to('first_error_label', 500);
        self.scroll_to_error = false;
      // }
    }
  },
  rm_tooltip:function(el){
    var idx = this.element.find("input:visible:not(:disabled)").add('.ui-helper-hidden-accessible').index(el);
    window.hide_error_popup(idx);
  },
  setup_events: function(){
    var self = this;
    if(typeof(dictinary) != "undefined" && dictinary){
      $('.translit:not(.js-hidden-translit)').translit({dictinary:dictinary});
      $('.valid_docnum:not(.sirena_doc_check)').translit({keyboard_en:true, dictinary:dictinary});
    }
      var char_list = window.getTranslitObject();
        char_list_keys = Object.keys(char_list).join("");
      var regex_input = new RegExp("[a-zA-Z"+char_list_keys+"\\-\\s]");
      var regex_replace = new RegExp('['+char_list_keys+']',"gi");

    // if( !window.is_mobile ){
      $('.alpha:not(.translit)').filter_input({regex:regex_input});
      $('.alpha:not(.translit):not(.js-hidden-translit)').bind('keyup change',function(){
          var start = this.selectionStart;
          var end = this.selectionEnd;
          $(this).val($(this).val().replace(regex_replace, function(matched){
            start = end += char_list[matched].length-1;
            return char_list[matched]
          }).capitalize(true, true))
          this.setSelectionRange(start, end);
      });
      $('.alpha_num:not(.valid_docnum)').filter_input({regex:'[a-zA-Z0-9]'});
      $('.bonuscard').filter_input({regex:'[a-zA-Z0-9]'});
      $('#name').filter_input({regex:'[A-Za-z0-9А-Яа-яїієэйъёьśćęąóżźłńŚĆĘĄÓŻŹŁŃŞÇĞÖşçğöüÜäßÄÖẞ,. ]'});
      $('#email').filter_input({translit:char_list, regex:'[a-zA-Z0-9@.!_-]' });
      $('#email').bind('focusout',function(){$(this).val($(this).val().replace(regex_replace, function(matched){return char_list[matched]}))});
      $('#email').bind('paste',function(e){
        var text = self.get_text_from_clipboard_by_event(e);
        if(text){
          e.preventDefault();
          $(e.target).val( text.replace(regex_replace, function(matched){return char_list[matched]}).replace(/\s/g,"") );
        }
      });
      $('.alpha,.translit').bind('keyup',function(){
        var start = this.selectionStart;
        var end = this.selectionEnd;
        $(this).val($(this).val().replace(/#|№/g, '').capitalize(true, true, ['ß']));
        this.setSelectionRange(start, end);
      });
    // }else{
    //   $('.alpha:not(.translit)').bind('focusout',function(){
    //                                                           $(this).val($(this).val().replace(regex_replace, function(matched){return char_list[matched]}));
    //                                                           $(this).val($(this).val().replace(/[^A-Za-z\- ]+/gi, ""));
    //                                                         });
    //   $('#email').filter_input({translit:char_list});

    //   $('.alpha_num:not(.valid_docnum)').bind('keyup', function(){ $(this).val($(this).val().replace(/[^a-zA-Z0-9]+/gi, ""))});
    //   $('.bonuscard').bind('focusout', function(){ $(this).val($(this).val().replace(/[^a-z0-9]+/gi, ""))});
    //   $('#name').bind('keyup', function(){ $(this).val($(this).val().replace(/[^A-Za-z0-9А-Яа-яїієэйъёьśćęąóżźłńŚĆĘĄÓŻŹŁŃŞÇĞÖşçğöüÜäßÄÖẞ,-\s]+/gi, ""))});
    // }

    if ($.browser.opera) {
      $('.passengers_block').find('.last_name input[type="text"], .first_name input[type="text"]').each(function() {
        $(this).bind('keyup change', function() {
          var caretPosition = $(this).caret().begin;
          $(this).val($(this).val().capitalize(true, true, ['ß']));
          $(this).caret(caretPosition);
        });
      });
    }
    $('.bonuscard').on('keydown.tab', function(e) {
      if (e.keyCode == 9) {
        if ($(e.target).parents('.passenger').next('.passenger').length) {
          $(e.target).parents('.passenger').next('.passenger').find('input[type="text"]:first').focus();
        } else {
          $('.user_contacts_block').find('input[type="email"]:first').focus();
        }
        return false;
      }
    });

    $(document).keydown(function(e){
      if ( e.keyCode == 8 && e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA' && $("a.another_flight").length > 0 ) {
        e.preventDefault();
        $("a.another_flight")[0].click();
        return;
      }else if(e.keyCode == 8 && (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA')
                &&  ($(e.target).attr('disabled') || $(e.target).attr('readonly')) ){
        e.preventDefault();
        return;
      }
      return true

    });

    $(".expire_date input[type='text']:disabled").closest("div").click(function () {
         var el = $(this).find("input[type='text']:first"), ei = el.attr('id').substr(-1);
         if (!!$('#docnum_' + ei).data('domestic') && !$('#doc_no_expiration_' + ei).parent().hasClass('checked')) {
              $('#doc_no_expiration_' + ei).parent().find('.iCheck-helper').click();
              $(".expire_date input[type='text']:first").focus();
         }
    });
  },

  hidden_translit:function(){
    window.avia_off_copy_bayer = true;
    if(typeof(dictinary) != "undefined" && dictinary){
      $('.translit').translit({dictinary:dictinary});
    }
    var char_list = window.getTranslitObject();
      char_list_keys = Object.keys(char_list).join("");
    var regex_input = new RegExp("[a-zA-Z"+char_list_keys+"\\-\\s]");
    var regex_replace = new RegExp('['+char_list_keys+']',"gi");
    $('.alpha:not(.translit)').bind('keyup',function(){
      var start = this.selectionStart;
      var end = this.selectionEnd;
      $(this).val($(this).val().replace(regex_replace, function(matched){return char_list[matched]}).capitalize(true, true))
      this.setSelectionRange(start, end);
    });

    $('.translit').keyup();
    $('.valid_docnum:not(.sirena_doc_check)').keyup();
    $('.alpha:not(.translit)').keyup();
    window.avia_off_copy_bayer = false;
  },
  setup_submit:function(){
    var self = this;
    this.setup_accept_events();
    this.element.find("form").ajaxformbar({
        load_time:120,
        hide_on_success: self.parent.hide_on_success,
        start: 10,
        success_tag: 'success',
        beforeSend: function(xhr, opts){
            var card_link = self.element.find("#lcc_charge_data");
            var checkbox = self.element.find("#accept_checkbox");
            if(card_link.length && card_link.data('hide_charge_popup') !== true){
                xhr.abort();
                card_link.trigger('click');
            }else if(!checkbox.is(":checked")){
                xhr.abort();
                self.element.find("#acception_popup_link").trigger('click');
            } else if(window.show_lowcost_confirm_popup){
                xhr.abort();
                $('#b2b_travel_fusion_popup').attachB2bTravelFusionPopup();
            }
        },
        success: function(response, textStatus, jqXHR){
          $(window).unbind('beforeunload');
          self.success_call_back(response);
        },
        error: function (xhr, ajaxOptions, thrownError) {
          self.error_call_back(xhr, ajaxOptions, thrownError)
        }
    });
  },
  setup_accept_events: function() {
      var form = this.element.find("form");
      var __self = this;
      $('body').on('click', '.acception_popup_close', function() {
          $.magnificPopup.close();
      });
      $('body').on('click', '.acception_popup_accept', function(e) {
          form.find("#accept_checkbox").prop('checked', 'checked').trigger('change');
          $.magnificPopup.close();
          if(!$(e.target).hasClass('js-open-from-sp')){
            form.find(".js-book-button").trigger('click');
          } else {
            $(e.target).removeClass('js-open-from-sp');
            $('.js-separate-page').trigger('click');
          }
      });
      $('body').on('click', '.js_lcc_charge_data_accept', function(e) {
          $.magnificPopup.close();
          var card_link = __self.element.find("#lcc_charge_data");
          card_link.data('hide_charge_popup', true);
          if(!$(e.target).hasClass('js-open-from-sp')){
            form.find(".js-book-button").trigger('click');
          } else {
            $(e.target).removeClass('js-open-from-sp');
            $('.js-separate-page').trigger('click');
          }
      });
      $('body').on('click', '.js_lcc_charge_data_change', function(e) {
          $.magnificPopup.close();
          form.find("#card_number_0").focus();
      });

  },
  check_agreement_checkbox_visibility: function(){
    var el = $("#accept_subscribe");
    if(el.length) {
      $.ajax({
        url:'/search/check_agreement_checkbox_visibility',
        type: 'POST',
        data: {
          "type": $("#accept_subscribe_checkbox").val()
        },
        dataType:"json",
        success: function(response, textStatus, jqXHR){
          (response.visible) ? el.show() : el.hide();
        },
        error: function(xhr, ajaxOptions, thrownError){
          el.show();
        }
      });
    }
  },
  check_nationality:function() {
    var countries = ['AF', 'IQ', 'PK', 'TR', 'SY', 'IR', 'SA', 'YE', 'AE', 'OM', 'AZ', 'KZ', 'UZ', 'KG', 'TM', 'TH', 'MY'];
    var specified_nationalities = $('.hidden_nationality').map(function () {
      return $(this).val()
    }).get();

    if ($(specified_nationalities).filter(countries).length > 0) {
      $('.URC_attention_block').show();
    } else {
      $('.URC_attention_block').hide();
    };
  },
  setup_s7_event:function(){
    var self = this;
    $(document).ready(function(){
      self.new_smart_choise();
      $(".js-spec_fare").change( function(ev){
        var el = $(ev.target);
        val = el.val();
        if(val == ''){ return false; }

        url = decodeURIComponent(window.location.href).replace($.parseParams(window.location.search.replace("?",""))['recommendation_id'], val);
        window.show_globus_loader();
        $("<form/>").ajaxformbar({
          url: url.replace('pre_booking', 'check_free_seats').replace('booking', 'check_free_seats')+'&rscfs=1',
          load_time: 15,
          loader_type:'line_bottom',
          hide_on_success: false,
          success_tag: 'success',
          text: window.I18n.avia_check_seats,
          success:function(response){
              if(response.success){
                $(window).unbind('beforeunload');
                if(url.indexOf("ig_r") == -1) url += '&ig_r=true';
                window.location.href = url;
              } else{
                window.hide_globus_loader();
                log_error(response.error, (session_id||''), '');
                message('msg_title', response.error, 'continue_button', window.close_message);
              }
          },
          error: function (xhr, ajaxOptions, thrownError) {
            window.hide_globus_loader();
            log_error(''+xhr.status+': '+thrownError, (session_id||''), '');
            message('msg_title', window.I18n.server_error, 'continue_button', window.close_message);
          }
        }).submit();
        return false;
      });

      $(".js-recommendations__popup-label").hover(
        function(){
          $('.s7-recommendations__popup').show();
        }, function() {
          $('.s7-recommendations__popup').hide();
        }
      );

    });
  },

  new_smart_choise:function(){
    var highestBox = 0;
    $('.js-equalheight').each(function(){
      if($(this).height() > highestBox)
      highestBox = $(this).height();
    });
    $('.js-equalheight').height(highestBox);
    $('.js-tariff-radio').each(function(){
      if ($(this).parent().hasClass("checked")) {
        $(this).parents('.s7-recommendations__text').addClass("checked");
      };
      $(this).on('ifChecked', function(event){
        var recommend = $(this).parents('.s7-recommendations__text');
        $('.s7-recommendations__text').removeClass("checked");
        $(this).parents('.s7-recommendations__text').addClass("checked");
        if (recommend.hasClass("js-s7-recommend")) {
          $(".s7-recommendations__popup").show();
        } else {
          $(".s7-recommendations__popup").hide();
        }
      });
    });
    $(".js-close-recommendation").click(function(){
      $(this).parent().hide();
    });
  },

  fill_ancillary_services:function(){
    setTimeout(function(){
      var grouped = {};
      pb_ancillary_services.split('_').map(function(v){
        var values = v.split('-');
        if(typeof grouped[values[4]] == "undefined")
          grouped[values[4]] = [];
        grouped[values[4]].push(v);
      });

      $.each(grouped, function(k, v){
        if(k == 'SA'){
          var sa_popup = $('#sa_popup');
          if(sa_popup.length > 0){
            var eventSA = window.is_mobile ? 'touchstart' : 'click';
            v.map(function(v_sub){
              var values = v_sub.split('-');
              var seats = sa_popup.find('#' + values[1] + '-' + values[2] + '-' + values[3] + '-' + values[4]);
              if(seats.length > 0){
                sa_popup.find('.js--accordeon-item__content input#pass_'+values[0]).iCheck('check');
                seats.find('#'+values[5]).trigger(eventSA);
              }
            })
            ancillaryServicesObj.commit_service('SA');
          }
        }else{
          var popup = $('#'+k.toLowerCase()+'_popup');
          if(popup){
            v.map(function(v_sub){
              popup.find('[data-index = "'+v_sub+'"]').iCheck('check');
            })
            ancillaryServicesObj.commit_service(k);
          }
        }
      })
    }, 10);
  }
  // FUNCTION END
});
$.Controller("V2PassengerPopup",{
  ".js-add-pass -> click":function(ev){
    ev.preventDefault();
    this.fill_data($(ev.target).parents('.js-passenger-row').data("passenger"));
    $.magnificPopup.close();
  },
  fill_data:function(passenger){
    this.element.remove();
    var field_hidden_el = ['citizenship', 'id'];
    for(var i in passenger){
      var el = this.options.ctrl.element.find("[id*="+i+"]" + ((!field_hidden_el.some(function(e) { return new RegExp(e).test(i); }))?':not(:hidden)':'') );
      if(el.length == 0) continue;
      if(/passengers_gender/.test(i)){
        el.iCheck('check');
        continue;
      }
      if(/citizenship/.test(i)){
        el.val(passenger[i]);
        el.change();
        var number = i.replace(/citizenship_/, '');
        var select = this.options.ctrl.element.find("[id*=citizenship_name_" + number + "]")
        select.val(passenger[i]).trigger('chosen:updated');
        select.change();
        this.options.ctrl.element.find('.main').click();
        continue;
      }
      if(/patronymic/.test(i) ){
        if(el[1]){
          el = $(el[1]);
        }else{
          continue;
        }
      }
      if(/doc_expire_date/.test(i) ){
        if(passenger[i]){
          if(!el.parent().find('input:checkbox').is(":checked")){
            el.parent().find('input:checkbox').click();
            el.attr('disabled','disabled');
            setTimeout(function(){el.removeAttr('disabled');},100);
          }
        }
      }
      if(/id/.test(i)){
        el.val(passenger[i]);
        continue;
      }
      this.options.ctrl.rm_tooltip(el);
      el.removeClass("error");
      if(/checkbox/.test(el.attr("type")))  el.change();
      el.val(passenger[i]).change();
    }
  }
});
$.Controller("V2PassengerSelect",{
  user_passengers: {},
  current_key: 0,
  reload_counter:0,
  genders_list:{},
  select_hover: true,

  start_length: 2,
  result_length: 4,
  reload_limit: 2,
  reload_time: 5, //sec
  init:function(){
    this.default_autocomplete_off();
    if(this.element.data('logged')) this.load_user_passengers();

    V2PassengerSelect.gender_list = gender_list;
  },
  set_event:function(){
    var self = this;
    $('.js-user-passengers-complete').on('keyup', function(e){
      if($(e.target).val().length >= V2PassengerSelect.start_length
          && ($(e.target).parents('.js-one-passenger-data').find('input[type="text"]:visible:first').attr('id') == $(e.target).attr('id')
              || $(e.target).parents('.js-one-passenger-data').find('input[type="text"]:visible:first').val().length == 0)){
        var pass = self.find_pass($(e.target));
        if(pass.length > 0)
        {
          self.clear_select();
          self.create_select(pass);
          $(e.target).after(self.element.removeClass('hidden'));
        } else
        {
          self.hide_select();
          self.clear_select();
        }
      }else{
        self.hide_select();
        self.clear_select();
      }
    });
    $('.js-user-passengers-complete').on('blur', function(e){
      if(!V2PassengerSelect.select_hover){
        self.hide_select();
        self.clear_select();
      }
    });
    $('.js-user-passengers-complete').on('focus', function(e){
      V2PassengerSelect.select_hover = false;
      $(e.target).keyup();
    })
    $('.js-up-select').on('mouseenter', function(){
      V2PassengerSelect.select_hover = true;
    })
    $('.js-up-select').on('mouseleave', function(){
      V2PassengerSelect.select_hover = false;
    })

  },
  find_pass:function(el){
    V2PassengerSelect.current_key = el.parents('.js-one-passenger-data').data('key');
    var result = [];
    $.each(V2PassengerSelect.user_passengers, function(id, pass){
      if(new RegExp("^"+el.val().toLowerCase()).test(V2PassengerSelect.user_passengers[id][el.attr('id').split('_')[0]].toLowerCase()) && result.length < V2PassengerSelect.result_length)
        result.push(pass);
    })
    return result;
  },
  create_select:function(pass){
    var self = this;
    var one_row = self.element.find('.js-up-one-row');
    self.element.find('li:not(.js-default-row)').remove();
    $.each(pass, function(id, one_pass){
      var cloned_one_row = one_row.clone().removeClass('js-default-row');
      cloned_one_row.attr('id', one_pass.id);
      cloned_one_row.find('span').each(function(el_i, field){
        var clear_field = $(field).attr('class').replace('js-up-','');

        if(one_pass[clear_field])
        {
          var text = one_pass[clear_field];
          switch (clear_field) {
            case "passengers_gender":
              if(V2PassengerSelect.gender_list[one_pass[clear_field].slice(0,1)])
                text = V2PassengerSelect.gender_list[one_pass[clear_field].slice(0,1)].capitalize();
              break;
          }
          $(cloned_one_row).find(field).text(text)
        }
      });
      cloned_one_row.removeClass('hidden');
      self.element.append(cloned_one_row);
    })

    var event = ((/iphone|ipad|ipod/i).test(navigator.userAgent.toLowerCase()))?'mouseenter':'click';
    $('.js-up-one-row').on(event, function(e){
      var el = $(e.target).hasClass('js-up-one-row')?$(e.target):$(e.target).parent();
      self.fill_data(V2PassengerSelect.user_passengers[el.attr('id')]);
      self.log_data(V2PassengerSelect.user_passengers[el.attr('id')]);
      self.hide_select();
      self.clear_select();
      $('.js-user-passengers-complete').blur();
    });
  },
  hide_select: function(){
    this.element.addClass('hidden');
  },
  clear_select:function(){
    this.element.find('li:not(.js-default-row)').remove();
  },
  default_autocomplete_off: function(){
    $('.js-user-passengers-complete').attr('autocomplete', 'off')
  },
  load_user_passengers:function(){
    var self = this;
    $.ajax({
      url: '/search/load_user_passengers',
      type: 'POST',
      dataType:"json",
      timeout:90000,
      success: function(response, textStatus, jqXHR){
        if(response.success){
          $.each(response.data, function(i, val){
            var date = self.get_date(val.birth_day).split('.');
            V2PassengerSelect.user_passengers[val.id] = {
              passengers_gender: val.gender,
              firstname: val.first_name,
              lastname: val.last_name,
              docnum: val.docnum,
              patronymic: val.patronymic,
              doc_type: val.doc_type,
              id: val.id,
              citizenship: val.country_id,
              birthday_day: date[0],
              birthday_month: date[1],
              birthday_year: date[2],
              birthday: date.join('.'),
              pref_air_seat:val.pref_air_seat,
              pref_air_meal: val.pref_air_meal,
              loyalty_cards: val.loyalty_cards,
            };
            if(val.doc_expire_date > 0) {
              var doc_date = self.get_date(val.doc_expire_date).split('.');
              V2PassengerSelect.user_passengers[val.id]['doc_expire_date_day']  = doc_date[0];
              V2PassengerSelect.user_passengers[val.id]['doc_expire_date_month']= doc_date[1];
              V2PassengerSelect.user_passengers[val.id]['doc_expire_date_year'] = doc_date[2];
              V2PassengerSelect.user_passengers[val.id]['doc_expire_date'] = date.join('.');
            }
          });
          self.set_event();
        }else{
          if((typeof(session_id)!="undefined")) log_error('Failed load user passengers', ((typeof(session_id)!="undefined" ? session_id : "")||''), '', 101010);
        }
      },
      error: function(xhr, ajaxOptions, thrownError ){
        if(xhr.status && (typeof(session_id)!="undefined")) log_error(''+xhr.status+': '+thrownError, ((typeof(session_id)!="undefined" ? session_id : "")||''), '', 101010);
        if(V2PassengerSelect.reload_counter < V2PassengerSelect.reload_limit){
          V2PassengerSelect.reload_counter++;
          setTimeout(function(){ self.load_user_passengers()}, V2PassengerSelect.reload_time*1000);
        }
      }
    });
  },
  get_date: function(timestamp){
    var date = new Date(parseInt(timestamp+10800)*1000);
    return ("0" + date.getUTCDate()).slice(-2) +'.'+("0" + (date.getUTCMonth() + 1)).slice(-2)+'.'+date.getUTCFullYear();
  },
  fill_data:function(passenger){
    var a = {};
    var field_hidden_el = ['citizenship', 'id', 'pref_air_seat', 'pref_air_meal', 'loyalty_cards'];
    var doc_exist = false;
    $('.js-passenger-info-'+V2PassengerSelect.current_key).find('.js-splited-date input').val('')
    for(var field in passenger){
      field_with_key = field + '_' + V2PassengerSelect.current_key;
      var el = $("[id*="+field_with_key+"]" + ((!field_hidden_el.some(function(e) { return new RegExp(e).test(field_with_key); }))?':not(:hidden)':'') );
      if(el.length == 0) continue;
      if(/passengers_gender/.test(field_with_key)){
        $("[id*="+field_with_key+"-"+((passenger[field].slice(0,1) == 'F')?'W':passenger[field].slice(0,1))+"]").iCheck('check');
        continue;
      }
      if(/citizenship/.test(field_with_key)){
        el.val(passenger[field]);
        el.change();
        var number = field_with_key.replace(/citizenship_/, '');
        var select = $("[id*=citizenship_name_" + number + "]")
        select.val(passenger[field]).trigger('chosen:updated');
        select.change();
        $('.main').click();
        continue;
      }
      if(/doc_expire_date/.test(field_with_key) ){
        if(passenger[field]){
          doc_exist = true;
          if(!el.parents('.db-col').find('input:checkbox').is(":checked")){
            el.parents('.db-col').find('input:checkbox').click();
            // el.attr('disabled','disabled');
            // setTimeout(function(){ console.log(el);el.removeAttr('disabled');},100);
          }
        }
      }
      if(/id/.test(field_with_key)){
        el.val(passenger[field_with_key]);
        continue;
      }
      el.removeClass("error");
      if(/checkbox/.test(el.attr("type")))  el.change();
      el.val(passenger[field]).change().keyup();
    }
    if(!doc_exist && $('#checkbox-validity-' + V2PassengerSelect.current_key).is(':checked')) $('#checkbox-validity-' + V2PassengerSelect.current_key).click().parents('.db-col').find('input').val('');
    $('samp').remove();
    $('.error').removeClass('error');
  },

  log_data:function(passenger){
    window.passenger = passenger;
    var tmp = [];
    $.each(passenger, function(i, k){ if(typeof(k) != "undefined") tmp.push(i+':'+k)})

    $.ajax({
      url: '/search/log_user_passenger',
      type: 'POST',
      dataType:"json",
      timeout:90000,
      data: {url: location.pathname, msg: tmp.join('|'), session_id: session_id, error_code: 101010, subdomain: window.cur_domain, status:1},
      success: function(response, textStatus, jqXHR){
      },
      error: function(xhr, ajaxOptions, thrownError ){
        if(xhr.status && (typeof(session_id)!="undefined")) log_error(''+xhr.status+': '+thrownError, ((typeof(session_id)!="undefined" ? session_id : "")||''), '', 101010);
      }
    });

  }
});
