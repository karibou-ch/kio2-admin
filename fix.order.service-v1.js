    OrderService.prototype.updateItem = /**
     * @param {?} order
     * @param {?} items
     * @param {?} fulfillment
     * @return {?}
     */
    function (order, items, fulfillment) {
        var _this = this;
        var /** @type {?} */ tosave = items.map(function (item) {
            var /** @type {?} */ elem = Object.assign({}, item);
            elem.finalprice = parseFloat(item.finalprice);
            elem.fulfillment.status = EnumFulfillments[fulfillment];
            return elem;
        });
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/items', tosave, {
            headers: this.headers,
            withCredentials: true
        }).pipe(map(function (order) { return _this.updateCache(order); }));
    };
