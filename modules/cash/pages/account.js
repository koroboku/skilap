var DateFormat = require('dateformatjs').DateFormat;
var df = new DateFormat("MM/dd/yyyy");
var sprintf = require('sprintf').sprintf;
var _ = require('underscore');
var async = require('async');
var safe = require('safe');

module.exports = function account(webapp) {
	var app = webapp.web;
	var cashapi = webapp.api;
	var prefix = webapp.prefix;

	app.get(webapp.prefix+'/account', function(req, res, next) {		
		var idx=0,c=0;
		var pageSize = 20;
		var count;
		async.waterfall([
			function (cb1) {
				cashapi.getAccountInfo(req.session.apiToken,req.query.id,['count','path'], cb1);
			},
			function (data, cb1) {
				count = data.count;
				webapp.guessTab(req, {pid:'acc'+req.query.id,name:data.path,url:req.url}, cb1);
			},
			safe.trap(function (vtabs,cb1) {
				var pageSize = 25;
				var firstVisible = Math.max(0, count-pageSize);
				var scrollGap = pageSize*5;
				var firstDelivered = Math.max(0, count-pageSize-scrollGap);
				res.render(__dirname+"/../views/account", {
					settings:{views:__dirname+"/../views"},
					tabs:vtabs,
					prefix:prefix,
					accountId:req.query.id,
					accountSize:count,
					firstVisible:firstVisible,
					pageSize:pageSize,
					scrollGap:scrollGap
				});
			})
		], function (err) {
			if (err) return next(err);
		});
	});

	app.post(webapp.prefix+'/account/:id/updatecell', function(req, res, next) {
		var newTr = null;
		async.waterfall([
			function (cb1) {
				async.parallel([
					function (cb2) {
						cashapi.getTransaction(req.session.apiToken, req.body.id, cb2);
					},
					function (cb2) {
						if (req.body.columnId==3){						
							cashapi.getAccountByPath(req.body.value, cb2);
						}
						else{ 							
							cb2(null,null);
						}
					}
				], function (err, results) {					
					cb1(err, results[0],results[1]);
				});
			},			
			function (tr, newAccId,cb1) {				
				if (req.body.columnId == 4 || req.body.columnId == 5) {
					var newVal = eval(req.body.value);
					if (req.body.columnId == 5)
						newVal *= -1;
					newTr = {id:tr.id,splits:[]};
					tr.splits.forEach(function(split) {
					if (split.accountId == req.params.id)
						newTr.splits.push({id:split.id,value:newVal})
					else
						newTr.splits.push({id:split.id,value:newVal*-1})
					});
				} else if (req.body.columnId == 3 ) {
					if (newAccId!=null) {
						newTr = {id:tr.id,splits:[]};
						tr.splits.forEach(function(split) {
							if (split.accountId != req.params.id)
								newTr.splits.push({id:split.id,accountId:newAccId})
						});
					}
				} else if (req.body.columnId == 2 ) {
					newTr = {id:tr.id,description:req.body.value};
				} else if (req.body.columnId == 1 ) {										
					var dateFormat = new DateFormat(DateFormat.W3C);
					var newDate = dateFormat.format(new Date(req.body.value));					
					newTr = {id:tr.id,dateEntered:newDate,datePosted:newDate};					
				}
				cashapi.saveTransaction(req.session.apiToken, newTr, cb1);
				res.send(req.body.value);
			}
		], function (err) {
			if (err) return next(err);
		});
	});
	
	app.post(webapp.prefix+'/account/:id/updaterow', function(req, res, next) {
		var newTr = null;		
		async.waterfall([
			function (cb1) {
				async.parallel([
					function (cb2) {
						cashapi.getTransaction(req.session.apiToken, req.body.id, cb2);
					},
					function (cb2) {
						if (req.body.columns[3]){						
							cashapi.getAccountByPath(req.body.columns[3], cb2);
						}
						else{ 							
							cb2(null,null);
						}
					}
				], function (err, results) {					
					cb1(err, results[0],results[1]);
				});
			},			
			function (tr, newAccId,cb1) {
				newTr = {id:tr.id};
				if (req.body.columns[1]) {										
					var dateFormat = new DateFormat(DateFormat.W3C);
					var dateEntered = dateFormat.format(new Date(req.body.columns[1]));
					var datePosted = dateFormat.format(new Date());					
					newTr['dateEntered'] = dateEntered;
					newTr['datePosted'] = datePosted;					
				}	
				if (req.body.columns[2]) {
					newTr['description'] = req.body.columns[2];
				}					
				if (req.body.columns[3]) {
					if (newAccId!=null) {
						newTr['splits'] = [];
						tr.splits.forEach(function(split) {
							if (split.accountId != req.params.id)
								newTr.splits.push({id:split.id,accountId:newAccId});
						});
						console.log('path changed');
						console.log(newTr.splits);
					}
				} 
				
				if (req.body.columns[4] || req.body.columns[5]) {
					var deposit = 0;
					if(req.body.columns[4]){
						deposit = eval(req.body.columns[4]);
					}
					var withdrawal = 0;
					if(req.body.columns[5]){
						withdrawal = eval(req.body.columns[5]);
					}
					var newVal = deposit - withdrawal;
					if(!newTr.splits){
						newTr['splits'] = [];
						console.log('splits not exists');
					}
					else{
						console.log('splits exists');
					}
					tr.splits.forEach(function(split) {
						if (split.accountId == req.params.id){
							newTr.splits.push({id:split.id,value:newVal});
						}
						else{
							var notAdded = true;
							console.log('notAdded=true');
							console.log(split.id);
							for(i=0;i<newTr.splits.length;i++){
								console.log('for by existing splits');
								console.log(newTr.splits[i].id);
								if(newTr.splits[i].id == split.id){
									console.log('matched!');
									newTr.splits[i].value = newVal*-1;
									console.log(newTr.splits);
									notAdded = false;
									break;
								}
							}
							if(notAdded){
								newTr.splits.push({id:split.id,value:newVal*-1});
							}
						}
					});
					console.log('totalSplits');
					console.log(newTr.splits);				
				} 				
				cashapi.saveTransaction(req.session.apiToken, newTr, cb1);
				res.send(req.body.id);
			}
		], function (err) {
			if (err) return next(err);
		});
	});

	app.get(webapp.prefix+'/account/:id/getaccounts', function(req, res, next) {
		var tmp = [];		
		async.waterfall([
			async.apply(cashapi.getAllAccounts, req.session.apiToken),
			function (accounts,cb1) {
				var tmp = [];
				async.forEach(accounts, function (acc, cb2) {
					cashapi.getAccountInfo(req.session.apiToken, acc.id, ["path"], safe.trap_sure_result(cb2,function (info) {
						if (info.path.search(req.query.term)!=-1)
							tmp.push(info.path);
						cb2();
					}));
				}, function (err) {
					cb1(err, tmp);
				})
			},
			function (hints, cb1) {				
				var hintsObject={};
				for(var i in hints){
					hintsObject[hints[i]] = hints[i];
				}
				res.send(hintsObject);
				cb1();
			} 
		], function (err) {
			if (err) return next(err);
		});
	});

	app.get(webapp.prefix+'/account/:id/getdesc', function(req, res) {
		var tmp = [];		
		async.waterfall([
			function (cb1) {
				cashapi.getAccountRegister(req.session.apiToken, req.params.id,0,null, cb1);
			},
			function (register,cb1) {
				var tmp = [];
				async.forEach(register, function (trs,cb2) {
					cashapi.getTransaction(req.session.apiToken,trs.id, safe.trap_sure_result(cb2,function(tr) {
						if (tr.description.search(req.query.term)!=-1)
							tmp.push(tr.description);
						cb2();
					}));
				}, function (err) {
					cb1(err,tmp);
				});
			},
			function (hints,cb1) {
				res.send(_.uniq(hints));
				cb1();
			}, 
		], function (err) {
			if (err) return next(err);
		});
	});

	app.get(webapp.prefix+'/account/:id/getgrid', function(req, res, next) {
		var data = {sEcho:req.query.sEcho,iTotalRecords:0,iTotalDisplayRecords:0,aaData:[]};
		var idx=Math.max(req.query.iDisplayStart,0);
		var count,register,currentAccountPath;
		async.waterfall([
			function (cb1) {
				cashapi.getAccountInfo(req.session.apiToken, req.params.id,["count","path"], cb1);
			},
			function (data,cb1) {
				count = data.count;
				currentAccountPath = data.path;				
				var limit = Math.min(count-idx,req.query.iDisplayLength);
				cashapi.getAccountRegister(req.session.apiToken, req.params.id,idx,limit, cb1);
			},
			function (register,cb1) {
				var aids = {}; 
				_.forEach(register, function (trs) {
					aids[trs.recv[0].accountId]=trs.recv[0].accountId;
				})
				async.parallel([
					function (cb2) {
						var transactions = [];
						async.forEach(register, function (trs, cb3) {
							cashapi.getTransaction(req.session.apiToken,trs.id,safe.trap_sure_result(cb3,function (tr) {
								transactions.push(tr);
								//console.log('transaction = ');
								//console.log(tr);
							}));
						}, function (err) {							
							cb2(err, transactions);
						});
					},
					function (cb2) {
						var accInfo = [];
						accInfo.push({'id':req.params.id,'path':currentAccountPath});					
						async.forEach(_.keys(aids), function (aid, cb3) {
							cashapi.getAccountInfo(req.session.apiToken, aid,["path"],safe.trap_sure_result(cb3,function(info) {
								accInfo.push(info);															
							}));
						}, function (err) {
							cb2(err, accInfo);
						});
					}
				], function (err, results) {
					cb1(err, register, results[0], results[1])
				})
			},
			safe.trap(function (register, transactions, accInfo, cb1) {
				var t={}; _.forEach(accInfo, function (e) { t[e.id]=e; }); accInfo = t;
				var i;
				for (i=0; i<_.size(register); i++) {
					var tr = transactions[i]; 
					var trs = register[i];
					var recv = trs.recv;
					var send = trs.send;
					var dp = new Date(tr.dateEntered);
					var splitsInfo=[];
					_.forEach(tr.splits,function(split){
						split.path = accInfo[split.accountId].path;
						splitsInfo.push(split);
					});								
					data.aaData.push([tr.id,df.format(dp),tr.description,
						recv.length==1?accInfo[recv[0].accountId].path:"Multiple",
						send.value>0?sprintf("%.2f",send.value):null,
						send.value<=0?sprintf("%.2f",send.value*-1):null,
						sprintf("%.2f",trs.ballance),splitsInfo]);
				}
				if ((idx+i)==count) {
					data.aaData.push(["new",df.format(new Date()),"",null,null,null,sprintf("%.2f",trs.ballance)]);
				}
				data.iTotalRecords = count+1;
				data.iTotalDisplayRecords = count+1;
				res.send(data);
			})
		], function (err) {
			if (err) return next(err);
		});
	});

}