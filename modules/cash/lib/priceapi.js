var async = require('async');
var safe = require('safe');
var _ = require('underscore');
var SkilapError = require("skilap-utils").SkilapError;

module.exports.getCmdtyPrice = function (token,cmdty,currency,date,method,cb) {
	var self = this;
	if (_(cmdty).isEqual(currency)) return cb(null,1);
	// not sure what template means
	if (cmdty.id=='template') return cb(null,1);
	async.series ([
		function start(cb) {
			async.parallel([
				function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
				function (cb) { self._waitForData(cb); }
			],cb);
		}, 
		function get(cb) {
			var key = (cmdty.space+cmdty.id+currency.space+currency.id);			
			var ptree = self._stats.priceTree[key];
			if (ptree==null) {
				if (method == "safe")
					return cb(null, 1);
				else
					return cb(new SkilapError("Unknown price pair","UnknownRate"));
			}
			cb(null,ptree.last);
		}], safe.sure(cb, function (results) {
			cb(null, results[1]);
		})
	);
};

module.exports.getCmdtyLastPrices = function (token,cb) {
	var self = this;
	var res = {};
	async.series ([
		function start(cb) {
			async.parallel([
				function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
				function (cb) { self._waitForData(cb); }
			],cb);
		}, 
		function get(cb) {
			_.each(self._stats.priceTree, function (v,k) {
				res[k]=v.last;
			})
			cb();
		}], safe.sure(cb, function (results) {
			cb(null, res);
		})
	);
};

module.exports.getPricesByPair = function (token,pair,cb) {
	var self = this;	
	async.series ([
		function start(cb) {
			async.parallel([
				function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
				function (cb) { self._waitForData(cb); }
			], cb);
		}, 
		function get(cb) {
			self._cash_prices.find({'cmdty.id': pair.from, 'currency.id': pair.to}).sort({'date': -1}).toArray(cb);
		}], safe.sure(cb, function (results) {
			process.nextTick( function () {
				cb(null, results[1]);
			});
		})
	);
};

module.exports.savePrice = function (token,price,cb) {
	var self = this;
	var pricen = {};	
	async.series ([
		function (cb) {
			async.parallel([
				function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
				function (cb) { self._waitForData(cb); }
			],cb);
		}, 
		function (cb) {					
			if (price._id) {
				self._cash_transactions.findOne({'_id': new self._ctx.ObjectID(price._id)},safe.sure_result(cb, function (price_) {
					pricen = _.extend(price,price_);
					pricen._id = new self._ctx.ObjectID(price._id);
				}));		
			} else {
				pricen = price;					
				pricen._id = new self._ctx.ObjectID();
			}
			cb();
		}, 
		function (cb) {			
			self._cash_prices.save(pricen, cb);			
		}], safe.sure(cb, function () {			
			self._calcStats(function () {});
			cb(null,pricen);
		})
	);
};

module.exports.clearPrices = function (token, ids, cb) {
	var self = this;
	if (ids == null) {
		async.series ([
			function (cb) {
				async.parallel([
					function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
					function (cb) { self._waitForData(cb); }
				],cb);
			},
			function (cb) {
				self._cash_prices.remove(cb);
			} 
		], safe.sure_result(cb, function () {
			self._calcStats(function () {});
		}));
	} else {
		async.series ([
			function (cb) {
				async.parallel([
					function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
					function (cb) { self._waitForData(cb); }
				],cb);
			},
			function(cb){
				self._cash_prices.remove({'_id': {$in: ids}}, cb);
			} 
		], safe.sure_result(cb, function () {
			self._calcStats(function () {});
		}));
	}
};

module.exports.importPrices = function  (token, prices, cb) {
	var self = this;
	async.series ([
		function (cb) {
			async.parallel([
				function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
				function (cb) { self._waitForData(cb); }
			],cb);
		},
		function (cb) {
			async.forEach(prices, function (e, cb) {
				self._cash_prices.save(e, cb);
			},cb);
		}, 
	], safe.sure_result(cb, function () {
		self._calcStats(function () {});
	}));
};
