function serializeForm(form) {
    var values = {}
    $.each($(form).serializeArray(), function(i, field) {
        values[field.name] = field.value;
    });
    return values;
}

function url_redirect(url, method, options, return_form){
    return_form = return_form || false;
    var $form = $("<form />");

    $form.attr("action", url);
    $form.attr("method", method);

    cnt_params = 0;
    if(options != null){
        $.each(options, function(name, value){
            cnt_params++;
            $form.append('<input type="hidden" name="'+name+'" value="'+value+'" />');
        });
    }

    if(return_form){
        return $form.wrap('<div/>').parent().html();
    }

    if(cnt_params == 0 && method == 'get'){
        window.location.href = url;
        return;
    }

    $("body").append($form);
    $form.submit();
}

function show_errors(data, form) {
    $.each(form[0], function(key, value){
      $(value).removeClass('error').parents('tr').removeClass('l_error').find('.td_msg .line_msg').hide();
    });

    if (data.html != 'undefined') $('.capcha', form).html(data.html);
    $.each(data.error_data, function(index){
        $.each(data.error_data[index], function(key, value){
           $('input[name="post['+key+']"]', form).addClass('error').parents('tr').addClass('l_error').find('td.td_msg .line_msg').show().find('.error_msg').text(typeof value == 'string' ? value : value.join( ". " )).show();
           $('select[name="post['+key+']"]', form).addClass('error').parents('tr').addClass('l_error').find('td.td_msg .line_msg').show().find('.error_msg').show();
           $('input[name="'+key+'"]', form).addClass('error').parents('tr').addClass('l_error').find('td.td_msg .line_msg').show().find('.error_msg').text(typeof value == 'string' ? value : value.join( ". " )).show();
           $('select[name="'+key+'"]', form).addClass('error').parents('tr').addClass('l_error').find('td.td_msg .line_msg').show().find('.error_msg').show();
        })
        var val = $.grep(data.error_data, function(n) { return n['birthday'] || n['date_of_registration']; })
        if (val.length) {
            $('.birthday select, .date_of_registration select', form).parents('tr').addClass('l_error').find('.td_msg .line_msg').show().find('.b_left .error_msg').text(val[0]['birthday']).show();
        }
    });
}

function printit(){
    if(window.print){
        window.print();
    } else {
        var WebBrowser = '<OBJECT ID="WebBrowser1" WIDTH=0 HEIGHT=0 CLASSID="CLSID:8856F961-340A-11D0-A96B-00C04FD705A2"></OBJECT>';
        document.body.insertAdjacentHTML('beforeEnd', WebBrowser);
        WebBrowser1.ExecWB(6, 2);
    }
}
;
