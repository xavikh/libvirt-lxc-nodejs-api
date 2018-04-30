function login() {
    let data = {
        email: $('#email').val(),
        password: $('#pass').val()
    };

    request('POST', '/login', null, data, (response) => {
        if (response.token) {
            cleanToken();
            saveToken(response.token, false);
            window.location.href = host + "/code";
        } else {
            M.toast({html: 'Some error ocurred :(', classes: "red"})
        }
    })
}

function request_code() {
    request('GET', '/send-code', getToken(), null, (response) => {
        M.toast({html: response.message, classes: "green"});
    })
}

function send_code() {
    let data = {
        code: $('#code').val()
    };

    request('POST', '/verify-code', getToken(), data, (response) => {
        if (response.token) {
            cleanToken();
            saveToken(response.token, false);
            window.location.href = host + "/dashboard";
        } else {
            M.toast({html: 'Some error ocurred :(', classes: "red"})
        }
    })
}

function signup() {
    let data = {
        name: $('#name').val(),
        email: $('#email').val(),
        password: $('#pass').val()
    };

    request('POST', '/signup', null, data, (response) => {
        M.toast({html: response.message, classes: "green"})
    })
}

function create_vm() {
    let data = {
        name: $('#vmname').val(),
        vcpu: Math.floor(document.getElementById('slider-step-cpu').noUiSlider.get()),
        ram: Math.floor(document.getElementById('slider-step-ram').noUiSlider.get()),
        volume_size: Math.floor(document.getElementById('slider-step-st').noUiSlider.get())
    };
    if (!data.name ||
        !data.vcpu ||
        !data.ram ||
        !data.volume_size) {
        return M.toast({html: "A parameter is missing", classes: "red"});
    }
    M.toast({html: "Processing...", classes: "amber"});
    request('POST', '/vm', getToken(), data, (response) => {
        M.toast({html: "VM created", classes: "green"});
        $('#modalCreateVm').modal('close');
        setTimeout(() => {location.reload()}, 1000);
    })
}

function change_vm_status(name, status) {
    M.toast({html: "Processing...", classes: "amber"});
    request('PUT', '/vm/' + name + '/' + status, getToken(), null, (response) => {
        M.toast({html: "Action completed", classes: "green"});
        setTimeout(() => {location.reload()}, 1000);
    })
}

function open_delete_modal(name) {
    $('#modalDeleteVm').data('vmname', name).modal('open');
}

function remove_vm() {
    let name = $('#modalDeleteVm').data('vmname');
    let delStorage = $('#deleteStorage').prop('checked');

    if (delStorage) {
        request('GET', '/vm/' + name + '/volumes', getToken(), null, (response) => {
            for (let i in response.volumes) {
                M.toast({html: "Deleting " + response.volumes[i] + " volume...", classes: "amber"});
                request('DELETE', '/vol/' + response.volumes[i], getToken(), null, (response) => {
                    M.toast({html: response.volumes[i] + " deletion complete", classes: "green"});
                });
            }
            M.toast({html: "Deleteing " + name + " virtual machine...", classes: "amber"});
            request('DELETE', '/vm/' + name, getToken(), null, (response) => {
                M.toast({html: "VM deletion complete", classes: "green"});
                setTimeout(() => {location.reload()}, 5000);
            });
        });
    } else {
        M.toast({html: "Deleteing " + name + " virtual machine...", classes: "amber"});
        request('DELETE', '/vm/' + name, getToken(), null, (response) => {
            M.toast({html: "VM deletion complete", classes: "green"});
            setTimeout(() => {location.reload()}, 3000);
        });
    }
}

