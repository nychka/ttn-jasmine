$.Controller("HeaderController",{
  init:function(){
    var _self  = this;

    _self.header_choser();
    _self.header_select();

    $(window).on('resize', function(){
      _self.headerResize();
    });
    $(document).ready(function(){
      _self.update_chosen_single_class(_self.element.find("[name='country_changer']"));
      typeof $().selectbox === 'function' ? _self.element.find('.ignore-selectbox').selectbox('detach').hide() : ''; //desable selectbox
    });
  },
  "update_chosen_single_class": function(el){
    var el = el;
    var el_id = el.attr('id');
    var el_chosen_single = this.element.find('#'+el_id+'_chosen a.chosen-single');
    el_chosen_single.removeAttr('class').addClass('chosen-single icon-'+el.val());
  },
  "header_select": function(){
    var select = this.element.find('.js-chosen-select');
    typeof $.fn.chosen != 'undefined' ? select.chosen() : '';
  },
  "header_choser": function(){
    var _self    = this;
    var body     = $('body');
    var lang     = _self.element.find('.js-header-choser');
    var langicur = _self.element.find('a').is('.js-current-lang');
    var langcur  = _self.element.find('#current-lang');
    langcur.on('click', function(ev){
      ev.preventDefault();
      $(this).toggleClass('active').parent().find(lang).toggle();
    });
    body.on('click', function(ev){
      var _self = $(ev.target);
      var _options = _self.is(lang) || _self.is(lang.find('*')) || _self.is(langcur) || _self.is(langcur.find('*'));
      !_options ? lang.removeAttr('style').parent().find(langcur).removeClass('active') : '';
    });
    lang.find('li').on('click', function(){
      $(window).unbind('beforeunload');
    });
  },
  "headerResize": function(){
    var headerNav = this.element.find('.js-header_nav');
    headerNav.removeAttr('style');
  },
  "loader": function(el, condition){
    var check = condition;
    var el = !!el ? el : $('body');
    var loader = $('<div class="loader-thin js-loader"></div>');
    !!check ? el.append(loader) : el.find('.js-loader').remove();
  },
  ".js-header-submit -> click":function(ev){
    this.loader(this.element.find('.js-country-choser'), true);
  },
  ".js-header_toggle -> click":function(ev){
    ev.preventDefault();
    this.element.find('.js-header_nav').slideToggle(300);
  },
  "[name='country_changer'] -> change":function(ev){
    var target = $(ev.target);
    var val = target.val();
    var submit = this.element.find('.js-header-submit');
    var lang = this.element.find('[name="language_changer"]');
    var url = '';
    this.update_chosen_single_class(target);
    lang.find('option').remove();
    url = allowed_projects[val].domain;
    for (var item in allowed_projects[val].language){
      var el = allowed_projects[val].language[item];
      lang.append('<option value="'+el.locale.substring(0, 2)+'">'+el.name+'</option>')
    }
    lang.chosen().trigger("chosen:updated");
    submit.attr('href', window.location.protocol + '//' + url).attr('data-href', window.location.protocol + '//' + url);
  },
  "[name='language_changer'] -> change":function(ev){
    var target = $(ev.target);
    var submit = this.element.find('.js-header-submit');
    var url = '/' + target.val();
    var dataUrl = submit.attr('data-href');
    submit.attr('href', dataUrl + url);
  }
});