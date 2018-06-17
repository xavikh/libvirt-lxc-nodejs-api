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
        M.toast({html: response.message, classes: "green"});
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

function open_delete_vmvol_modal(vm_name, vol_name) {
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

function open_clone_vol_modal(vol_name) {
    let modal = $('#modalCloneVol');
    let cloneBtn = $('#cloneVolBtn');
    cloneBtn.click(function () {
        cloneVolume(vol_name);
    });

    modal.modal('open');
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
    M.toast({html: "Deleting " + vol_name + " volume...", classes: "amber"});
    request('DELETE', '/vol/' + vol_name, getToken(), null, (response) => {
        M.toast({html: vol_name + " deletion complete", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function open_delete_vol_modal(vol_name) {
    let modal = $('#modalDeleteVol');
    let delBtn = $('#deleteVolBtn');
    delBtn.click(function () {
        deleteVolume(vol_name);
    });

    modal.modal('open');
}

function createVolume(vol_name, vol_size) {
    let data = {
        name: vol_name,
        size: vol_size
    };
    M.toast({html: "Creating " + vol_name + " volume...", classes: "amber"});
    request('POST', '/vol/', getToken(), data, (response) => {
        M.toast({html: vol_name + " created", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function open_create_vol_modal() {
    let modal = $('#modalCreateVol');
    let createBtn = $('#createVolBtn');

    createBtn.click(function () {
        let vol_name = $('#volname').val();
        let vol_size = $('#volsize').val();
        createVolume(vol_name, vol_size);
    });

    modal.modal('open');
}

function deleteIso(iso_name) {
    let data = {
        iso: iso_name
    };
    M.toast({html: "Deleting " + iso_name + " image...", classes: "amber"});
    request('DELETE', '/iso/', getToken(), data, (response) => {
        M.toast({html: iso_name + " deletion complete", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function open_delete_iso_modal(iso_name) {
    let modal = $('#modalDeleteIso');
    let delBtn = $('#deleteIsoBtn');
    delBtn.click(function () {
        deleteIso(iso_name);
    });

    modal.modal('open');
}

function hashCode(str) {
    return str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0) + 2147483647;
}

function refreshDownloads() {
    let table = $("#iso-downloads");
    //table.empty();
    request('GET', '/iso/download/info', getToken(), null, (response) => {

        let resHashedIs = [];
        let domHashedIds = [];

        for (let key in response) {
            resHashedIs.push(hashCode(key) + '');
        }

        let isos_rows = $("#iso-downloads > *");
        for (let n = 0; n < isos_rows.length; n++) {
            domHashedIds.push(isos_rows.get(n).id);
        }

        let differences = domHashedIds.filter(x => !resHashedIs.includes(x));

        differences.map((id) => {
            let elem = $("#" + id);
            elem.empty();
            elem.remove();
        });

        if (Object.keys(response).length > 0) {
            for (let key in response) {
                let hashkey = hashCode(key);
                let table_row = $("#" + hashkey);
                if (!table_row.length) {
                    table.append("<tr id='" + hashkey + "'>" +
                        "<td class='iso-name'>" + key + "</td>" +
                        "<td class='hide-on-small-only'>" +
                        "   <div class='progress'>" +
                        "       <div class='determinate' style='width: " + response[key].percent * 100 + "%'></div>" +
                        "   </div>" +
                        "</td>" +
                        "<td class='iso-size'>" + parseInt(response[key].size.total / 1048576) + "</td>" +
                        "<td class='iso-speed'>" + parseInt(response[key].speed / 1048576) + "</td>" +
                        "<td class='iso-eta'>" + parseInt(response[key].time.remaining) + "</td>" +
                        "<td class='iso-action'>" +
                        "   <a class='waves-effect waves-light btn-small vol-del-btn red' onclick=\"stopDownload('" + key + "')\">" +
                        "       <i class='material-icons'>stop</i>" +
                        "   </a>" +
                        "</td>" +
                        "</tr>")
                } else {
                    let progress = $('#' + hashkey + ' .determinate');
                    progress.width((response[key].percent * 100) + "%");
                    let speed = $('#' + hashkey + ' .iso-speed');
                    speed.text(parseInt(response[key].speed / 1048576));
                    let eta = $('#' + hashkey + ' .iso-eta');
                    eta.text(parseInt(response[key].time.remaining));
                }
            }
            setTimeout(() => {
                refreshDownloads();
            }, 1000);
        }
    });
}

function stopDownload(filename) {
    let data = {
        filename: filename
    };
    M.toast({html: "Stopping " + filename + " download...", classes: "amber"});
    request('PUT', '/iso/download/stop', getToken(), data, (response) => {
        M.toast({html: filename + " download stopped", classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function createDownload() {
    let download_url = $('#download_url').val();
    let data = {
        url: download_url
    };
    M.toast({html: "Starting download...", classes: "amber"});
    request('POST', '/iso/download', getToken(), data, (response) => {
        M.toast({html: response.message, classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
    setTimeout(() => {
        location.reload()
    }, 2000);
}

function create_download_modal() {
    let modal = $('#modalCreateIso');
    let createBtn = $('#createIsoBtn');
    createBtn.click(function () {
        createDownload();
    });

    modal.modal('open');
}

function open_console(vm_name) {
    request('GET', '/vm/' + vm_name + '/console', getToken(), null, (response) => {
        let strWindowFeatures = "location=no,height=768,width=1020,left=10,top=10,scrollbars=yes,status=no,menubar=no,titlebar=no,toolbar=no";
        let URL = "/console?token=" + response.token;
        let win = window.open(URL, "_blank", strWindowFeatures);
    });
}

function create_ct() {
    let name = $('#ctname').val();
    let templateSelect = $('#templateSelect');
    templateSelect.formSelect();
    let template = templateSelect.formSelect('getSelectedValues')[0];

    let data = {
        template: template,
        name: name
    };
    M.toast({html: "Creating the container...", classes: "amber"});
    request('POST', '/ct', getToken(), data, (response) => {
        M.toast({html: response.message, classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function change_ct_status(name, status) {
    M.toast({html: "Processing...", classes: "amber"});
    request('POST', '/ct/' + name + '/' + status, getToken(), data, (response) => {
        M.toast({html: response.message, classes: "green"});
        setTimeout(() => {
            location.reload()
        }, 2000);
    });
}

function open_console_ct(ct_name) {
    request('GET', '/ct/' + ct_name + '/console', getToken(), null, (response) => {
        let strWindowFeatures = "location=no,height=768,width=1020,left=10,top=10,scrollbars=yes,status=no,menubar=no,titlebar=no,toolbar=no";
        let URL = "/wetty_console?token=" + response.token;
        let win = window.open(URL, "_blank", strWindowFeatures);
    });
}