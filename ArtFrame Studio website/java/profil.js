var email = document.forms['form']['email'];
var password = document.forms['form']['password'];

var email_error = document.getElementById('email_error');
var pass_error = document.getElementById('pass_error');

email.addEventListener('textInput', email_Verify);
password.addEventListener('textInput', pass_Verify);

function validated() {
    if (!email.value.includes('@') || !email.value.includes('.com')) {
        email.style.border = "1px solid red";
        email_error.style.display = "block";
        email_error.textContent = "Неточен формат на е-пошта.";
        email.focus();
        return false;
    }
    if (password.value.length < 6) {
        password.style.border = "1px solid red";
        pass_error.style.display = "block";
        pass_error.textContent = "Внеси нова лозинка.";
        password.focus();
        return false;
    }
    return true;
}
function email_Verify() {
    if (email.value.includes('@') && email.value.includes('.com')) {
        email.style.border = "1px solid silver";
        email_error.style.display = "none";
        return true;
    }
}
function pass_Verify() {
    if (password.value.length >= 6) {
        password.style.border = "1px solid silver";
        pass_error.style.display = "none";
        return true;
    }
}
 
