function login() {
    let data = {
        email: $('#email').val(),
        password: $('#pass').val()
    };

    request('POST', '/login-web', null, data, (response) => {
        M.toast({html: "Logged", classes: "green"});
        if (response.redirect) {
            window.location.href = host + response.redirect;
        }
    })
}

function startCountdown(expirationTime) {
    $('#countdown').data("expirationTime", expirationTime);
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    let timeCd = ($('#countdown').data("expirationTime") - Date.now()) / 1000;
    let min_seg = '0:00';
    if (timeCd > 0) {
        min_seg = Math.floor(timeCd / 60) + ':' + ('' + parseInt(timeCd % 60)).padStart(2, '0');
    }
    $('#countdown').html(min_seg);

}

function verifyTelegramAccount() {
    request('GET', '/verify-telegram-account', getToken(), null, (response) => {
        $('#code').html(response.code);
        let date = new Date(response.expireTime);
        startCountdown(date.getTime());
    })
}

function request_code() {
    request('GET', '/send-code', getToken(), null, (response) => {
        M.toast({html: response.message, classes: "green"});
        let date = new Date(response.expireTime);
        startCountdown(date.getTime());
    })
}

function send_code() {
    let data = {
        code: $('#code').val()
    };

    request('POST', '/verify-code-web', getToken(), data, (response) => {
        M.toast({html: 'Logged', classes: "green"});
        if (response.redirect) {
            window.location.href = host + response.redirect;
        }
    })
}

function signup() {
    let data = {
        name: $('#name').val(),
        email: $('#email').val(),
        password: $('#pass').val(),
        avatar_image: $('#avatar').val()
    };

    request('POST', '/signup', null, data, (response) => {
        M.toast({html: response.message, classes: "green"})
        window.location.href = host + "/login";
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
        setTimeout(() => {
            location.reload()
        }, 1000);
    })
}

function change_vm_status(name, status) {
    M.toast({html: "Processing...", classes: "amber"});
    request('PUT', '/vm/' + name + '/' + status, getToken(), null, (response) => {
        M.toast({html: "Action completed", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 1000);
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
            M.toast({html: "Deleting " + name + " virtual machine...", classes: "amber"});
            request('DELETE', '/vm/' + name, getToken(), null, (response) => {
                M.toast({html: "VM deletion complete", classes: "green"});
                setTimeout(() => {
                    location.reload()
                }, 5000);
            });
        });
    } else {
        M.toast({html: "Deleteing " + name + " virtual machine...", classes: "amber"});
        request('DELETE', '/vm/' + name, getToken(), null, (response) => {
            M.toast({html: "VM deletion complete", classes: "green"});
            setTimeout(() => {
                location.reload()
            }, 1000);
        });
    }
}

function deleteVolumeAttached(vm_name, vol_name) {
    let data = {
        volName: vol_name
    };

    M.toast({html: "Detaching " + vol_name + " volume...", classes: "amber"});
    request('PUT', '/vm/' + vm_name + '/detach-disk', getToken(), data, (response) => {
        M.toast({html: vol_name + " detaching complete", classes: "green"});

        M.toast({html: "Deleting " + vol_name + " volume...", classes: "amber"});
        request('DELETE', '/vol/' + vol_name, getToken(), null, (response) => {
            M.toast({html: vol_name + " deletion complete", classes: "green"});
            setTimeout(() => {
                location.reload()
            }, 2000);
        });
    });
}

function open_delete_vol_modal(vm_name, vol_name) {
    let modal = $('#modalDeleteVol');
    let delBtn = $('#deleteVolBtn');
    delBtn.click(function () {
        deleteVolumeAttached(vm_name, vol_name);
    });

    modal.modal('open');
}

function attachVol(vm_name, vol_name) {
    let data = {
        volName: vol_name
    };
    M.toast({html: "Attaching " + vol_name + " volume...", classes: "amber"});
    request('PUT', '/vm/' + vm_name + '/attach-disk', getToken(), data, (response) => {
        M.toast({html: vol_name + " attaching complete", classes: "green"});
    });
}

function detachVol(vm_name, vol_name) {
    let data = {
        volName: vol_name
    };

    M.toast({html: "Detaching " + vol_name + " volume...", classes: "amber"});
    request('PUT', '/vm/' + vm_name + '/detach-disk', getToken(), data, (response) => {
        M.toast({html: vol_name + " detaching complete", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 1000);
    });
}

function open_attach_vol_modal(vm_name) {
    let modal = $('#modalAttachVol');
    let attachBtn = $('#attachVolBtn');
    let vol_select = $('#vol_select');
    attachBtn.off("click");
    attachBtn.click(function () {
        let selection = vol_select.formSelect('getSelectedValues');
        if (selection.length > 0) {
            for (let select_vol in selection) {
                setTimeout(() => {
                    attachVol(vm_name, selection[select_vol]);
                }, 2000 * select_vol);
            }
            setTimeout(() => {
                location.reload()
            }, 3000 * selection.length);
        } else {
            M.toast({html: "Must select at least one volume", classes: "red"});
        }
    });
    request('GET', '/vol/info', getToken(), null, (response) => {
        for (let vol in response) {
            vol_select.append("<option value=\"" + response[vol].name + "\"> " + response[vol].name + " (" + response[vol].allocation / 1048576 + "MB/" + response[vol].capacity / 1048576 + "MB)</option>>")
        }

        vol_select.prop('selectedIndex', 0);
        vol_select.formSelect();

        modal.modal('open');
    });
}

function open_detach_vol_modal(vm_name, vol_name) {
    let modal = $('#modalDetachVol');
    let detachVolBtn = $('#detachVolBtn');

    detachVolBtn.off("click");
    detachVolBtn.click(function () {
        detachVol(vm_name, vol_name);
    });
    modal.modal('open');
}

function attachCdrom(vm_name) {
    let iso_select = $('#iso_select');
    iso_select.formSelect();
    let iso = iso_select.formSelect('getSelectedValues')[0];

    if (iso) {
        let data = {
            iso: iso
        };

        M.toast({html: "Attaching " + data.iso + " image...", classes: "amber"});
        request('PUT', '/vm/' + vm_name + '/attach-cdrom', getToken(), data, (response) => {
            M.toast({html: data.iso + " attaching complete", classes: "green"});
            setTimeout(() => {
                location.reload()
            }, 1000);
        });
    }
}

function detachCdrom(vm_name) {
    M.toast({html: "Detaching image...", classes: "amber"});
    request('PUT', '/vm/' + vm_name + '/detach-cdrom', getToken(), null, (response) => {
        M.toast({html: "Detaching complete", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 1000);
    });
}

function cloneVolume(vol_name) {
    M.toast({
        html: "<span style='width: 150px;'>Cloning the volume</span></span><div class=\"progress\" style='width: 320px;'>\n" +
        "<div class=\"indeterminate\"></div>\n" +
        "</div>", classes: "amber",
        displayLength: 100000
    });
    request('POST', '/vol/' + vol_name + '/clone', getToken(), null, (response) => {
        M.Toast.dismissAll();
        M.toast({html: "Volume cloned", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 1000);
    });
}

function deleteVolume(vol_name) {
    
}
