// Reset button is clicked

$('#btn_pwd').click(function() {
	$('#taracot-pwd-error').hide();
	$('.taracot-auth-field').removeClass('uk-form-danger');
	if (!$('#pwd_password').val().match(/^.{8,80}$/) || $('#pwd_password').val() != $('#pwd_password_repeat').val()) {
		$('#pwd_password').addClass('uk-form-danger');
		$('#pwd_password_repeat').addClass('uk-form-danger');
		$('#pwd_password').focus();
		$('#taracot-pwd-error').html(_lang_vars.invalid_password_syntax);
		$('#taracot-pwd-error').show();
		return;
	}
	$('#set_password_div').hide();
	$('#reset_res').hide();
	$('#pwd_loading').show();
	$('#taracot-pwd-error').hide();
	$.ajax({
		type: 'POST',
		url: '/auth/password/process',
		data: {
			user: user,
			code: code,
			password: $('#pwd_password').val()
		},
		dataType: "json",
		success: function(data) {
			if (data.result != 1) {
				$('#set_password_div').show();
				$('#reset_res').show();
				$('#pwd_loading').hide();
				if (data.field) {
					$('#' + data.field).addClass('uk-form-danger');
					if (data.field == 'pwd_password') $('#pwd_password_repeat').addClass('uk-form-danger');
					$('#' + data.field).select();
					$('#' + data.field).focus();
				}
				if (data.error) {
					$('#taracot-pwd-error').html(data.error);
					$('#taracot-pwd-error').show();
				}
			} else {
				$('#pwd_loading').hide();
				$('#pwd_success').show();
			}
		},
		error: function() {
			$('#set_password_div').show();
			$('#pwd_loading').hide();
			$('#reset_res').show();
			$('#taracot-pwd-error').html(_lang_vars.ajax_failed);
			$('#taracot-pwd-error').show();
		}
	});
});

// Check password complexity

var pwd_password_event_input = function() {
    var ps = evalPassword($('#pwd_password').val());
    var str = (ps + 1) * 20;
    $('#pwd_password_strength').css('width', str + '%');
    $('#pwd_password_strength').html(_lang_vars['password_strength_' + ps]);
    $('#pwd_password_strength').parent().removeClass('uk-progress-success');
    $('#pwd_password_strength').parent().removeClass('uk-progress-warning');
    $('#pwd_password_strength').parent().removeClass('uk-progress-danger');
    if (ps <= 1) $('#pwd_password_strength').parent().addClass('uk-progress-danger');
    if (ps == 2 || ps == 3) $('#pwd_password_strength').parent().addClass('uk-progress-warning');
    if (ps == 4) $('#pwd_password_strength').parent().addClass('uk-progress-success');
    $('#pwd_password_match').css('color', '#eee');
    if (ps > 0 && $('#pwd_password').val() == $('#pwd_password_repeat').val()) $('#pwd_password_match').css('color', '#9fd256');
};

var pwd_password_repeat_event_input = function() {
    var ps = evalPassword($('#pwd_password').val());
    $('#pwd_password_match').css('color', '#eee');
    if (ps > 0 && $('#pwd_password').val() == $('#pwd_password_repeat').val()) $('#pwd_password_match').css('color', '#9fd256');
};

$('#pwd_password').on('input', pwd_password_event_input);
$('#pwd_password_repeat').on('input', pwd_password_repeat_event_input);

// Authorize button is clicked

$('#btn_auth').click(function() {
	location.href = '/auth?rnd=' + Math.random().toString().replace('.', '');
});

// Bind <Enter> key to form input fields

$('.taracot-auth-field').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_pwd').click();
		e.preventDefault();
	}
});