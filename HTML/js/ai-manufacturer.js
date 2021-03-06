'use strict';

let productDiv = 'productDiv';

function loadManufacturerUX() {

    let toLoad = 'manufacturer.html';
    getPort();
    if ((typeof (manufacturer) === 'undefined') || (manufacturer === null) || (manufacturer.length === 0)) {
        $.when($.get(toLoad), $.get('/setup/getPort'), deferredMemberLoad()).done(function (page, port, res) {
            setupManufacturer(page[0], port[0]);
        });
    }
    else {
        $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port) {
            setupManufacturer(page[0], port[0]);
        });
    }
}

function setupManufacturer(page, port) {
    
    $('#body').empty();
    $('#body').append(page);
    msgPort = port.port;
    
    wsDisplay('manufacturer_messages', msgPort);
    
    let _createProduct = $('#newProduct');
    let _listProduct = $('#productStatus');
    let _listOrder = $('#orderStatus');
    let _productDiv = $('#' + productDiv);
    
    _createProduct.on('click', function () {
        displayProductForm();
    });
    _listProduct.on('click', function () {
        listProducts();
    });
    _listOrder.on('click', function () {
        listManufacturerOrder();
    })
    
    $('#manufacturer').empty();
    
    for (let each in manufacturer) {
        (function (_idx, _arr) {
            $('#manufacturer').append('<option value="' + _arr[_idx].id + '">' + _arr[_idx].id + '</option>');
        })(each, manufacturer);
    }
    $('#company')[0].innerText = manufacturer[0].companyName;
    $('#manufacturer').on('change', function () {
        _productDiv.empty(); $('#manufacturers_messages').empty(); $('#company')[0].innerText = findMember($('#manufacturer').find(':selected').text(), manufacturer).companyName;
    });

}

function displayProductForm() {

    let toLoad = 'createProduct.html'
    let contents = [];
    let contentNo = 0;
    $.when($.get(toLoad)).done(function (page) {
        let _productDiv = $('#' + productDiv);
        _productDiv.empty();
        _productDiv.append(page);

        $('#agriOrg').empty();
        $('#agriOrg').append(ao_string);

        $('#agriOrg').val($('#agriOrg option:first').val());
        
        $('#productId').append('abc');
        $('#status').append('Created');
        $('#today').append(new Date().toISOString());
        $('#approved').append('False');

        $('#cancelNewProduct').on('click', function () { _productDiv.empty(); });

        $('#submitNewProduct').hide();

        $('#submitNewProduct').on('click', function () {
            let option = {};
            option.agriOrganisation = $('#agriOrg').find(':selected').val();
            option.manufacturer = $('#manufacturer').find(':selected').val();
            option.productName = $('#productName').val();
            option.content = contents;
            option.productType = $('#productType').val();
            option.bestBefore = $('#bestBefore').val();
            option.mrp = $('#mrp').val();
            _productDiv.empty();

            $.when($.post('/composer/client/addProduct', option)).done(function (_res) {
                _productDiv.empty();
                $('#manufacturer_messages').prepend(formatMessage(_res.result));
            })
        });

        $('#addContent').on('click', function () {

            let _str = '{"contentNo":"';
            _str += ++contentNo;
            _str += '","name":"' + $('#contentName').val();
            _str += '","percentage":"' + $('#contentPercentage').val() + '"}'
            contents.push(_str);
            let _html = '';
            _html += '<tr><td>' + contentNo + '</td><td>' + $('#contentName').val() + '</td><td>' + $('#contentPercentage').val() + '</td></tr>';
            $('#contentTable').append(_html);
        });
        $('#submitNewProduct').show();
    })
}

function listProducts() {
    let option = {};
    option.id = $('#manufacturer').find(':selected').text();

    option.userId = option.id;
    $.when($.post('/composer/client/getMyProducts', option)).done(function (_result) {

        if ((typeof (_result.Products) === 'undefined') || _result.Products === null) {
            console.log('error getting Products: ', _result);
        }
        else {
            if (_result.Products.length < 1) {
                $('#productDiv').empty(); $('#productDiv').append(formatMessage('no product available'));
            }
            else {
                formatproduct($('#productDiv'), _result.Products);
            }
        }
    });
}

function formatproduct(_target, _products) {

    _target.empty();
    let _str = '';
    let _date = '';
    for (let each in _products) {
        (function (_idx, _arr) {
            let _action = '<th><select id=mp_action' + _idx + '><option value="NoAction">Take no Action</option>';

            let r_string;
            r_string = '</th>';

            switch (JSON.parse(_arr[_idx].status).code) {

                case productStatus.ProductCreated.code:
                    _date = _arr[_idx].productCreated;
                    _action += '<option value="RequestApproval">Request Approval</option>';
                    break;
                case productStatus.RequestApproval.code:
                    _date = _arr[_idx].requestApproval;
                    break;
                case productStatus.ApproveProduct.code:
                    _date = _arr[_idx].approveProduct;
                    _action += '<option value="ManufactureProduct">Manufacture Product</option>';
                    r_string = '<br/>Quantity<input id="m_quantity' + _idx + '" type="number"></input></th>';
                    break;
                case productStatus.RejectProduct.code:
                    _date = _arr[_idx].rejectProduct;
                default:
                    break;
            }
            let _button = '<th><button id="m_btn_' + _idx + '">Execute</button></th>';
            _action += '</select>';
            
            if (_idx > 0) {
                _str += '<div class="spacer"></div>';
            }

            _str += '<div class="acc_header off" id="product' + _idx + '_h" target="product' + _idx + '_b">';
            _str += '<table class="wide"><tr><th>ProductId</th><th>Status</th><th class="centre">Approved</th><th colspan="3" class="right">Org: ' + findMember(_arr[_idx].agriOrganisation.split('#')[1], agriOrgs).companyName + '</th></tr>';
            _str += '<tr><th id ="m_product' + _idx + '" class="showFocus" width="20%">' + _arr[_idx].id + '</th><th width="50%">' + JSON.parse(_arr[_idx].status).text + ': ' + _date + '</th><th class="centre">' + _arr[_idx].approved + '</th>' + _action + r_string + _button + '</tr></table>';
            _str += '<table class="wide"><tr align="center"><th>Sr. no</th><th>Content Name</th><th>Percentage</th></tr>';

            for (let every in _arr[_idx].content) {
                (function (_idx2, _arr2) {
                    let _item = JSON.parse(_arr2[_idx2]);
                    _str += '<tr><td align="center" width="20%">' + _item.contentNo + '</td><td width="50%">' + _item.name + '</td><td align="right">' + _item.percentage + '</td><tr>';
                })(every, _arr[_idx].content);
            }
            _str += '</table></div>';
            
            if (_arr[_idx].approved) {
                _str += formatDetail(_idx, _arr[_idx]);
            }
        })(each, _products);
    }
    _target.append(_str);

    for (let each in _products) {
        (function (_idx, _arr) {
            $('#m_product' + _idx).on('click', function () {
                accToggle('productDiv', 'product' + _idx + '_b', 'product' + _idx + '_   h');
            });
            $('#product' + _idx + '_b').on('click', function () {
                accToggle('productDiv', 'product' + _idx + '_b', 'product' + _idx + '_h');
            });
            $('#m_btn_' + _idx).on('click', function () {
                let option = {};
                option.action = $('#mp_action' + _idx).find(':selected').text();
                option.productId = $('#m_product' + _idx).text();
                option.participant = $('#manufacturer').val();

                if (option.action === 'Manufacture Product') {
                    option.quantity = parseInt($('#m_quantity' + _idx).val());
                }
                
                $('#manufacturer_messages').prepend(formatMessage(option.action + 'for' + option.productId + 'Requested'));
                
                $.when($.post('/composer/client/productAction', option)).done(function (_result) {
                    $('#manufacturer_messages').prepend(formatMessage(_result.result));
                });
            });
        })(each, _products)
    }
}

function formatDetail(_cur, _product) {
    let _out = '<div class="acc_body off" id="product' + _cur + '_b">';
    _out += '<h3 id="status">Current quantity : ' + _product.totalQuantity + '</h3>';
    _out += '<table class="wide"><tr><th id="batchid">Batch ID</th><th id="by">By</th><th id="date">Date</th><th id="quantity">Quantity</th></tr>';
    
    for (let every in _product.batches) {
        (function (_idx2, _arr2) {
            let _item = JSON.parse(_arr2[_idx2]);
            _out += '<tr><td align="center">' + _item.batchId + '</td><td>' + _product.manufacturer + '</td><td>' + _item.mfgDate + '</td><td>' + _item.quantity + '</td><tr>';
        })(every, _product.batches);
    }
    _out += '</table></div>'

    return _out;
}

function listManufacturerOrder() {
    let options = {};
    options.id = $('#manufacturer').find(':selected').text();
    options.userID = options.id;

    $.when($.post('/composer/client/getMyOrders', options)).done(function (_results) {
        if ((typeof (_results.orders) === 'undefined') || (_results.orders === null)) {
            console.log('error getting orders: ', _results);
        }
        else {
            if (_results.orders.length < 1) {
                $('#productDiv').empty(); $('#productDiv').append(formatMessage('no product available' + options.id));
            }
            else {
                formatManufacturerOrders($('#productDiv'), _results.orders);
            }
        }
    });
}

function formatManufacturerOrders(_target, _orders) {
    _target.empty();
    let _str = '';
    let _date = '';

    for (let each in _orders) {
        (function (_idx, _arr) {
            let _action = '<th><select id=mo_action' + _idx + '><option value="NoAction">Take no Action</option>';
            let r_string;
            r_string = '</th>';

            switch (JSON.parse(_arr[_idx].status).code) {
                case orderStatus.Created.code:
                    _date = _arr[_idx].created;
                    _action += '<option value="AcceptOrder">Accept Order</option>';
                    break;
                case orderStatus.PayRequest.code:
                    _date = _arr[_idx].paymentRequested;
                    break;
                case orderStatus.Authorize.code:
                    _date = _arr[_idx].approved;
                    break;
                case orderStatus.Accepted.code:
                    _date = _arr[_idx].accepted;
                    _action += '<option value="PayRequest">Request Payment</option>';
                    break;
                case orderStatus.Cancelled.code:
                    _date = _arr[_idx].cancelled;
                    break;
                case orderStatus.Paid.code:
                    _date = _arr[_idx].paid;
                    break;
                default:
                    break;
            }

            let _button = '<th><button id="mo_btn_' + _idx + '">Execute</button></th>';
            _action += '</select>';

            if (_idx > 0) {
                _str += '<div class="spacer"></div>';
            }

            _str += '<table class="wide"><tr><th>OrderId</th><th>Status</th><th class="centre">Total</th><th colspan="3" class="right">Retailer: ' + _arr[_idx].retailer.toString().split('#')[1].split('}')[0] + '</th></tr>';
            _str += '<tr><th id ="mo_order' + _idx + '" width="20%">' + _arr[_idx].id + '</th><th width="50%">' + JSON.parse(_arr[_idx].status).text + ': ' + _date + '</th><th class="right">$' + _arr[_idx].amount + '.00</th>' + _action + r_string + _button + '</tr></table>';
            _str += '<table class="wide"><tr align="center"><th>Item Id</th><th>Item Name</th><th>Quantity</th><th>Price</th></tr>'
            
            for (let every in _arr[_idx].items) {
                (function (_idx2, _arr2) {
                    let _item = JSON.parse(_arr2[_idx2]);
                    _str += '<tr><td align="center" width="20%">' + _item.productId + '</td><td width="50%">' + _item.productName + '</td><td align="center">' + _item.quantity + '</td><td align="right">$' + _item.extendedPrice + '.00</td><tr>';
                })(every, _arr[_idx].items);
            }
            _str += '</table>';
        })(each, _orders);
    }
    _target.append(_str);

    for (let each in _orders) {
        (function (_idx, _arr) {
            $('#mo_btn_' + _idx).on('click', function () {
                let options = {};
                options.action = $('#mo_action' + _idx).find(':selected').text();
                options.orderId = $('#mo_order' + _idx).text();
                options.participant = $('#manufacturer').val();
                if ((options.action === 'Dispute') || (options.action === 'Resolve')) {
                    options.reason = $('#mo_reason' + _idx).val();
                }
                if ((options.action === 'Update Delivery Status')) {
                    options.delivery = $('#mo_reason' + _idx).val();
                }
                
                $('#retailer_messages').prepend(formatMessage('Processing' + options.action + 'for order :' + options.orderId));
                
                $.when($.post('/composer/client/orderAction', options)).done(function (_results) {
                    $('#retailer_messages').prepend(formatMessage(_results.result));
                });
            });
        })(each, _orders)
    }
}
