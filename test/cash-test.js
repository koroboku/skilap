var async = require('async');
var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;
var assert = require('assert');
var tutils = require('./utils');
var safe = require('safe');
var _ = require('lodash');
var helpers = require('./helpers');
var assert = require('assert');

/*
 * Some notices:
 * For save database use
 * 		this.saveDb('debug');
 * For load database use
 * 		before(function(){
			this.restoreDb('debug');
		});
 *	For skip current test
 * 		describe.skip
 * 	For run only current test
 * 		describe.only
 * 	When error occurs, screenshot is available in test's dir (active)
 * 	Predefined data stored in file `dataentry.json`
 *	Frequently called functions should be defined in helpers
 * */

describe("Cash module",function () {
	this.timeout(30000);
	before(tutils.setupContext);
	before(function (done) {
		this.browser.manage().window().setSize(1280,768);	
		this.restoreDb('core-users');	
		this.fixture('dataentry').then(tutils.noerror(done));
	});
	afterEach(tutils.afterEach);

	describe("Default dataset", function () {
		var curUser = 0;
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			helpers.login.call(self, self.fixtures.dataentry.users[curUser], true);
			self.done();
		});
		it("Can be created", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Cash module")).click();
			self.browser.findElement(By.xpath("//*[contains(.,'Assets:')]"));
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("New register")).click();	
			self.browser.findElement(By.id("acc_curency")).sendKeys("USD");
			self.browser.findElement(By.xpath("//input[@value='Confirm']")).click();
			self.done();
		});
		it("Should have some accounts", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//*[contains(.,'Accidental')]"));
			self.browser.findElement(By.xpath("//*[contains(.,'Car')]"));
			self.browser.findElement(By.xpath("//*[contains(.,'Fuel')]"));
			self.browser.findElement(By.xpath("//*[contains(.,'Life')]"));
			self.browser.findElement(By.xpath("//*[contains(.,'Food')]"));
			self.browser.findElement(By.xpath("//*[contains(.,'Other')]"));
			self.done();
		});
		it("Account should have proper currency", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//span[contains(.,'$')]"));
			self.done();
		});
	});
	describe("Manage prices", function () {
		it("Add price for USD in EUR", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Rate Currency Editor")).click();	
			self.browser.findElement(By.id("firstCurrency")).sendKeys("USD");
			self.browser.findElement(By.id("secondCurrency")).sendKeys("EUR");
			self.browser.findElement(By.xpath("//button[.='Apply']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//button[.='Add']"));
			});
			self.browser.findElement(By.xpath("//button[.='Add']")).click();
			helpers.runModal.call(this, null, function(modal) {
		        modal.findElement(By.id("datepicker")).sendKeys("05/20/13");
				modal.findElement(By.id("newrate")).sendKeys("1.5");	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//td[@class='date' and contains(.,'20')]"));	
			self.browser.findElement(By.xpath("//td[@class='rate' and .='1.5']"));	
			self.done();
		});
		it("Edit price of USD in EUR", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//td[@class='rate' and .='1.5']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//button[.='Edit']"));
			});
			self.browser.findElement(By.xpath("//button[.='Edit']")).click();
			helpers.runModal.call(this, null, function(modal) {
				modal.findElement(By.id("datepicker")).clear();	
		        modal.findElement(By.id("datepicker")).sendKeys("05/21/13\n");
				modal.findElement(By.id("newrate")).clear();	
				modal.findElement(By.id("newrate")).sendKeys("1.6");	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//td[@class='date' and contains(.,'21')]"));	
			self.browser.findElement(By.xpath("//td[@class='rate' and .='1.6']"));	
			self.done();
		});
		it("Delete price pair", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//td[@class='rate' and .='1.6']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//button[.='Delete']"));
			});
			self.browser.findElement(By.xpath("//button[.='Delete']")).click();
			helpers.runModal.call(this, null, function(modal) {
				modal.findElement(By.id("save")).click();
			});
			self.browser.isElementPresent(By.xpath("//td[@class='date' and contains(.,'21')]")).then(function (isPresent) {
				assert.ok(!isPresent, "Not deleted");
			});
			self.browser.isElementPresent(By.xpath("//td[@class='rate' and .='1.6']")).then(function (isPresent) {
				assert.ok(!isPresent, "Not deleted");
			});
			self.done();
		});
	});
	describe("Export and import", function () {
		var sum = '';
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});		
		it("Import sample gnucash file", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("Import Gnu Cash")).click();	
			self.browser.executeScript("document.getElementById('upload-file').setAttribute('style', '')");
			self.browser.findElement(By.id("upload-file")).sendKeys(__dirname + self.fixtures.dataentry.cashimport.file);
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//h3[.='" + self.fixtures.dataentry.cashimport.parsedtext + "']"));
			});
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//*[contains(.,'" + self.fixtures.dataentry.cashimport.finishedtext + "')]"));
			});
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//h2[contains(.,'Assets:')]"));
			});			
			self.saveDb('cash-gnucash').then(function() {
				self.done();
			});
		});
		it("Home page should have right ballance", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//*[contains(.,'" + self.fixtures.dataentry.cashimport.sum + "')]"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				sum = text;
				self.done();
			});
		});
		it("Export Skilap Cash", function(done) {
			var self = this;
			self.trackError(done);
			var http = require('http');
			var fs = require('fs');

			self.browser.manage().getCookies().then(function(cookies) {
				var c = cookies[0].name + '=' + cookies[0].value + ';' + cookies[1].name + '=' + cookies[1].value;
				var file = fs.createWriteStream(__dirname + "/data/raw.zip");
				var options = {
						  host: "localhost",
						  port: 80,
						  path: '/cash/export/raw',
						  headers: {"Cookie": c}
						};
				http.get(options, function(response) {
					response.pipe(file);
					self.done();
				});
			});
		});
		it("Import Skilap Cash", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("Import Skilap Cash")).click();	
			self.browser.executeScript("document.getElementById('upload-file').setAttribute('style', '')");
			self.browser.findElement(By.id("upload-file")).sendKeys(__dirname + "/data/raw.zip");
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//h3[.='" + self.fixtures.dataentry.cashimport.parsedtext + "']"));
			});
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//*[contains(.,'" + self.fixtures.dataentry.cashimport.finishedtext + "')]"));
			});
			self.browser.findElement(By.xpath("//button[@type='submit']")).click();	
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//h2[contains(.,'Assets:')]"));
			});			
			self.done();
		});
		it("Home page balance should be the same as before", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(sum == text, "Import error");
				self.done();
			});
		});
	});
	describe("Manage accounts", function () {
		it("Create root test account", function(done) {
			var self = this;
			self.trackError(done);
			var acc1 = self.fixtures.dataentry.accounts[0];		
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.id("add_new")).click();
			helpers.runModal.call(self, null, function(modal) {
		        modal.findElement(By.id("acc_name")).sendKeys(acc1.name);
				modal.findElement(By.id("acc_parent")).sendKeys(acc1.parent);	
				modal.findElement(By.id("acc_curency")).sendKeys(acc1.currency);	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//a[contains(.,'" + acc1.name + "')]"));	
			self.done();
		});
		it("Create child test account", function(done) {
			var self = this;
			self.trackError(done);
			var acc2 = self.fixtures.dataentry.accounts[1];		
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.id("add_new")).click();
			helpers.runModal.call(self, null, function(modal) {
		        modal.findElement(By.id("acc_name")).sendKeys(acc2.name);
				modal.findElement(By.id("acc_parent")).sendKeys(acc2.parent);	
				modal.findElement(By.id("acc_curency")).sendKeys(acc2.currency);	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//a[contains(.,'" + acc2.name + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + acc2.parent + "')]//div[contains(./a,'" + acc2.name + "')]"));	
			self.done();
		});
		it("Edit changing parent and name", function(done) {
			var self = this;
			self.trackError(done);
			var child = self.fixtures.dataentry.accounts[1];		
			var parent2 = self.fixtures.dataentry.accounts[2];
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.id("add_new")).click();
			helpers.runModal.call(self, null, function(modal) {
		        modal.findElement(By.id("acc_name")).sendKeys(parent2.name);
				modal.findElement(By.id("acc_parent")).sendKeys(parent2.parent);	
				modal.findElement(By.id("acc_curency")).sendKeys(parent2.currency);	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//a[contains(.,'" + parent2.name + "')]"));	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + child.name + "')]/span/a[./i[@title='edit']]")).click();	
			self.done();
		});
		it("Edit changing parent and name", function(done) {
			var self = this;
			self.trackError(done);
			var child = self.fixtures.dataentry.accounts[1];		
			var parent2 = self.fixtures.dataentry.accounts[2];
			helpers.runModal.call(self, null, function(modal) {
		        modal.findElement(By.id("acc_name")).clear();
		        modal.findElement(By.id("acc_name")).sendKeys(child.name_new);
				modal.findElement(By.id("acc_parent")).sendKeys(parent2.name);	
				modal.findElement(By.id("acc_curency")).sendKeys(child.currency);	
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//a[contains(.,'" + child.name_new + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + parent2.name + "')]//div[contains(./a,'" + child.name_new + "')]"));	
			self.done();
		});
	});
	describe("Manage accounts (delete)", function () {
		var all = '';
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('cash-gnucash');	
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});
		it("Move transactions and subaccounts to another account", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				all = text;
			});
			var accParent = 'Imbalance-RUB';
			var accDelete = 'сбербанк';
			var accChild = 'Test1';
			var sumBefore = '';
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				sumBefore = text;
			});
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + accDelete + "')]//div[contains(./a,'" + accChild + "')]"));	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='move']")).click();
		        modal.findElement(By.id("tr_parent")).sendKeys(accParent);
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='move']")).click();
		        modal.findElement(By.id("sub_acc_parent")).sendKeys(accParent);
				modal.findElement(By.id("delete")).click();
			});
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//div[contains(./a,'" + accParent + "')]/span"));
			});	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + accParent + "')]//div[contains(./a,'" + accChild + "')]"));	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				assert.ok(sumBefore != text, "Move error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all == text, "Move sum error");
			});
			self.done();
		});
		it("Delete transactions and delete sub accounts and delete subaccount transactions", function(done) {
			var self = this;
			self.trackError(done);
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			var accDelete = 'QIWI Bank';
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc_tr']//input[@id='del']")).click();
				modal.findElement(By.id("delete")).click();
			});
			self.browser.findElements(By.xpath("//div[contains(./a,'" + accDelete + "')]")).then(function (elements) {
				assert.ok(elements.length == 0, "Delete error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all != text, "Delete sum error");
				all = text;
			});
			self.done();
		});
		it("Delete transactions and delete sub accounts moving transaction to another account", function(done) {
			var self = this;
			self.trackError(done);
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			var accDelete = 'Разное';
			var accParent = 'Особый Bank';
			var sumBefore = '';
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				sumBefore = text;
			});
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc_tr']//input[@id='move']")).click();
		        modal.findElement(By.id("sub_acc_trn_parent")).sendKeys(accParent);
				modal.findElement(By.id("delete")).click();
			});
			self.browser.findElements(By.xpath("//div[contains(./a,'" + accDelete + "')]")).then(function (elements) {
				assert.ok(elements.length == 0, "Delete error");
			});
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				assert.ok(sumBefore != text, "Move error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all != text, "Delete sum error");
			});
			self.done();
		});
	});
	describe("Manage sub accounts (delete)", function () {
		var all = '';
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('cash-gnucash');	
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});		
		it("Move transactions and subaccounts to another account", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				all = text;
			});
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			var accParent = 'Imbalance-RUB';
			var accDelete = 'Test1';
			var accChild = 'test2';
			var sumBefore = '';
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				sumBefore = text;
			});
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + accDelete + "')]//div[contains(./a,'" + accChild + "')]"));	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='move']")).click();
		        modal.findElement(By.id("tr_parent")).sendKeys(accParent);
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='move']")).click();
		        modal.findElement(By.id("sub_acc_parent")).sendKeys(accParent);
				modal.findElement(By.id("delete")).click();
			});
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//div[contains(./a,'" + accParent + "')]/span"));
			});	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + accParent + "')]//div[contains(./a,'" + accChild + "')]"));	
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				assert.ok(sumBefore != text, "Move error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all == text, "Move sum error");
			});
			self.done();
		});
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('cash-gnucash');	
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});		
		it("Delete transactions and delete sub accounts and delete subaccount transactions", function(done) {
			var self = this;
			self.trackError(done);
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			var accDelete = 'Test1';
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc_tr']//input[@id='del']")).click();
				modal.findElement(By.id("delete")).click();
			});
			self.browser.findElements(By.xpath("//div[contains(./a,'" + accDelete + "')]")).then(function (elements) {
				assert.ok(elements.length == 0, "Delete error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all != text, "Delete sum error");
				all = text;
			});
			self.done();
		});
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('cash-gnucash');	
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});		
		it("Delete transactions and delete sub accounts moving transaction to another account", function(done) {
			var self = this;
			self.trackError(done);
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			var accDelete = 'Test1';
			var accParent = 'Особый Bank';
			var sumBefore = '';
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				sumBefore = text;
			});
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accDelete + "')]/span/a[./i[@title='delete']]")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.xpath("//div[@id='sub_tr']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc']//input[@id='del']")).click();
				modal.findElement(By.xpath("//div[@id='sub_acc_tr']//input[@id='move']")).click();
		        modal.findElement(By.id("sub_acc_trn_parent")).sendKeys(accParent);
				modal.findElement(By.id("delete")).click();
			});
			self.browser.findElements(By.xpath("//div[contains(./a,'" + accDelete + "')]")).then(function (elements) {
				assert.ok(elements.length == 0, "Delete error");
			});
			self.browser.findElement(By.xpath("//div[contains(./a,'" + accParent + "')]/span")).getText().then(function(text) {
				assert.ok(sumBefore != text, "Move error");
			});
			
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(all != text, "Delete sum error");
			});
			self.done();
		});
	});
	describe("Registry input", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.done();
		});	
		it("Creat empty", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Cash module")).click();
			self.browser.findElement(By.xpath("//*[contains(.,'Assets:')]"));
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("New register")).click();	
			self.browser.findElement(By.id("acc_curency")).sendKeys("USD");
			self.browser.findElement(By.xpath("//input[@value='Confirm']")).click();
			self.done();
		});
		it("Add transaction", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(tr.path);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(tr.deposit + '\n');
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date + "']")).then(function (isPresent)
						 { tmp1 = isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='total']/div[.='" + tr.total + "']"));
			self.done();
		});
		it("Home page should have right ballance", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[0];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr.deposit + "')]]/li/a[.='" + tr.parent +"']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr.deposit + "')]]/li/a[.='" + tr.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(tr.deposit) != -1, "Sum error");
				self.done();
			});
		});
		it("Accounts page should have right ballance", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[0];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr.parent + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr.deposit + "')]]/a[contains(.,'" + tr.name + "')]"));
			self.done();
		});
		it("Add transaction 2", function(done) {
			var self = this;
			self.trackError(done);
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.browser.findElement(By.xpath("//div/a[contains(.,'" + tr1.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr2.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr2.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr2.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(tr2.path);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(tr2.deposit);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);
			var tmp2 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr2.date + "']")).then(function (isPresent)
						 { tmp2 = isPresent; } );
				return tmp2;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr2.date + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='num']/div[.='" + tr2.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='description']/div[.='" + tr2.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div[.='" + tr2.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='deposit']/div[.='" + tr2.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='total']/div[.='" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "']"));
			self.done();
		});
		it("Home page should have right ballance 2", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Accounts page should have right ballance 2", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.parent + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/a[contains(.,'" + tr1.name + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr2.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr2.deposit + "')]]/a[contains(.,'" + tr2.name2 + "')]"));
			self.saveDb('register-test').then(function() {
				self.done();
			});
		});
	});
	describe("Registry edit", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('register-test');
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});
		it("Change date for first row by click", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			var tr2 = self.fixtures.dataentry.trs[2];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']//input")).sendKeys(tr2.date);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']")).click();

			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr1.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr1.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr1.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr1.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='" + tr1.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr1.total + "']"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']/div[.='" + tr2.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='total']/div[.='" + (parseFloat(tr.deposit) + parseFloat(tr1.deposit)) + "']"));
			self.done();
		});
		it("Home page should have right ballance", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Change date back by enter", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']//input")).sendKeys(Key.RETURN);

			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr.total + "']"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']/div[.='" + tr1.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']/div[.='" + tr1.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']/div[.='" + tr1.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div[.='" + tr1.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='deposit']/div[.='" + tr1.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='total']/div[.='" + (parseFloat(tr.deposit) + parseFloat(tr1.deposit)) + "']"));
			self.done();
		});
		it("Home page should have right ballance 2", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Change num field", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			var tr2 = self.fixtures.dataentry.trs[2];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']//input")).sendKeys(tr2.num);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']//input")).sendKeys(Key.RETURN);

			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr2.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr.total + "']"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']/div[.='" + tr1.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']/div[.='" + tr1.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']/div[.='" + tr1.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div[.='" + tr1.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='deposit']/div[.='" + tr1.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='total']/div[.='" + (parseFloat(tr.deposit) + parseFloat(tr1.deposit)) + "']"));
			self.done();
		});
		it("Home page should have right ballance 3", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Change description and account field", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			var tr2 = self.fixtures.dataentry.trs[2];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']//input")).sendKeys(tr2.description);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).sendKeys(tr2.path);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr2.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr2.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr2.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr.total + "']"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']/div[.='" + tr1.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']/div[.='" + tr1.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']/div[.='" + tr1.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div[.='" + tr1.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='deposit']/div[.='" + tr1.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='total']/div[.='" + (parseFloat(tr.deposit) + parseFloat(tr1.deposit)) + "']"));
			self.done();
		});
		it("Home page should have right ballance 4", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/li/a[.='" + tr2.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr2.deposit + "')]]/li/a[.='" + tr2.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr2.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Accounts page should have right ballance", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			var tr3 = self.fixtures.dataentry.trs[2];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.parent + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + (parseFloat(tr2.deposit) + parseFloat(tr1.deposit)) + "')]]/a[contains(.,'" + tr1.name + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr2.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr2.deposit + "')]]/a[contains(.,'" + tr2.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr3.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr1.deposit + "')]]/a[contains(.,'" + tr3.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.name2 + "')]"));
			self.done();
		});
		it("Change spent field", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			var tr2 = self.fixtures.dataentry.trs[2];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']//input")).sendKeys(tr2.withdrawal);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr2.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr2.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr2.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='withdrawal']/div[.='" + tr2.withdrawal + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr2.total + "']"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='date']/div[.='" + tr1.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']/div[.='" + tr1.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='description']/div[.='" + tr1.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div[.='" + tr1.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='deposit']/div[.='" + tr1.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='total']/div[.='" + (parseFloat(tr1.deposit) - parseFloat(tr2.withdrawal)) + "']"));
			self.done();
		});
		it("Home page should have right ballance 4", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[1];
			var tr2 = self.fixtures.dataentry.trs[2];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Home")).click();	
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr1.deposit) - parseFloat(tr2.withdrawal)) + "')]]/li/a[.='" + tr.parent + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + (parseFloat(tr1.deposit) - parseFloat(tr2.withdrawal)) + "')]]/li/a[.='" + tr.name + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Assets:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr1.deposit) - parseFloat(tr2.withdrawal)) != -1, "Sum error");
			});
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr1.deposit + "')]]/li/a[.='" + tr1.name2 + "']"));
			self.browser.findElement(By.xpath("//ul[span[contains(., '" + tr1.deposit + "')]]/li/a[.='" + tr1.name1 + "']"));
			self.browser.findElement(By.xpath("//h2[contains(.,'Liabilities:')]/span")).getText().then(function(text) {
				assert.ok(text.indexOf(parseFloat(tr1.deposit)) != -1, "Sum error");
				self.done();
			});
		});
		it("Accounts page should have right ballance 4", function(done) {
			var self = this;
			var tr1 = self.fixtures.dataentry.trs[0];
			var tr2 = self.fixtures.dataentry.trs[1];
			var tr3 = self.fixtures.dataentry.trs[2];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.parent + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + (parseFloat(tr2.deposit) - parseFloat(tr3.withdrawal)) + "')]]/a[contains(.,'" + tr1.name + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr2.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr2.deposit + "')]]/a[contains(.,'" + tr2.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr3.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr3.withdrawal + "')]]/a[contains(.,'" + tr3.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr1.name2 + "')]"));
			self.done();
		});
	});
	describe("Reconcile value editing", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('register-test');
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();			
			self.done();
		});
		it("Simple click", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']/div[.='n']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']")).click();
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']/div[.='c']"));
			self.browser.navigate().refresh();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp2 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp2 = !isPresent; } );
				return tmp2;
			});
			self.done();
		});
		it("Splits click", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			self.browser.findElement(By.xpath("//label[contains(., 'Split')]/input")).click();
			self.browser.findElement(By.xpath("//tr/td/div[.='" + tr.name1 + "::" + tr.name2 + "']")).click();
			self.browser.findElement(By.xpath("//tr[td/div[.='" + tr.name1 + "::" + tr.name2 + "']]/td[@data-name='rstate']/div[.='c']"));
			self.browser.findElement(By.xpath("//tr[td/div[.='" + tr.parent + "::" + tr.name + "']]/td[@data-name='rstate']/div[.='c']"));
			self.browser.findElement(By.xpath("//label[contains(., 'Split')]/input")).click();
			
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']/div[.='c']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']/div[.='n']"));
			});
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='rstate']/div[.='n']"));
			self.browser.findElement(By.xpath("//label[contains(., 'Split')]/input")).click();
			self.browser.findElement(By.xpath("//tr[td/div[.='" + tr.name1 + "::" + tr.name2 + "']]/td[@data-name='rstate']/div[.='n']"));
			self.browser.findElement(By.xpath("//tr[td/div[.='" + tr.parent + "::" + tr.name + "']]/td[@data-name='rstate']/div[.='n']"));
			self.done();
		});
	});
	describe("Create and edit with creating of new account", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.done();
		});	
		it("Creat empty", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Cash module")).click();
			self.browser.findElement(By.xpath("//*[contains(.,'Assets:')]"));
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("New register")).click();	
			self.browser.findElement(By.id("acc_curency")).sendKeys("USD");
			self.browser.findElement(By.xpath("//input[@value='Confirm']")).click();
			self.done();
		});
		it("Add transaction 1", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(tr.path);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(tr.deposit + '\n');
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date + "']")).then(function (isPresent)
						 { tmp1 = isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='total']/div[.='" + tr.total + "']"));
			self.done();
		});
		it("Add transaction 2", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[3];
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(tr.path);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.TAB);
			helpers.runModal.call(this, null, function(modal) {
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(tr.deposit + '\n');
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date + "']")).then(function (isPresent)
						 { tmp1 = isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='total']/div[.='" + tr.total + "']"));
			self.done();
		});
		it("Accounts page should have right ballance", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[3];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name1 + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + tr.name1 + "')]//div[contains(./a,'" + tr.name2 + "')]"));	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr.deposit + "')]]/a[contains(.,'" + tr.name2 + "')]"));
			self.done();
		});
		it("Edit existing row", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[0];
			var tr1 = self.fixtures.dataentry.trs[4];
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).sendKeys(tr1.name1 + "::" + tr1.name2);
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			helpers.runModal.call(this, null, function(modal) {
				modal.findElement(By.id("save")).click();
			});

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div[.='" + tr1.name1 + "::" + tr1.name2 + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='total']/div[.='" + tr.total + "']"));

			self.done();
		});
		it("Accounts page should have right ballance", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[3];
			var tr1 = self.fixtures.dataentry.trs[4];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name1 + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + tr.name1 + "')]//div[contains(./a,'" + tr.name2 + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + tr1.name1 + "')]//div[contains(./a,'" + tr1.name2 + "')]"));	
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr.deposit + "')]]/a[contains(.,'" + tr.name2 + "')]"));
			self.done();
		});
	});
	describe("Split mode input and edit", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.done();
		});	
		it("Creat empty", function(done) {
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Cash module")).click();
			self.browser.findElement(By.xpath("//*[contains(.,'Assets:')]"));
			self.browser.findElement(By.linkText("Data")).click();	
			self.browser.findElement(By.linkText("New register")).click();	
			self.browser.findElement(By.id("acc_curency")).sendKeys("USD");
			self.browser.findElement(By.xpath("//input[@value='Confirm']")).click();
			self.done();
		});

		it("Splits click", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[5];
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//label[contains(., 'Split')]/input")).click();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.done();
		});

		it("Click on input row, it should expand in in split mode.", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[5];
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]"));
			
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='path' and contains(.,'" + tr.parent + "::" + tr.name + "')]"));
			
			self.done();
		});
		
		it("Verify that some fields are non editable.", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']/div/input"));
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']/div/input"));
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']/div/input"));
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']")).click();
			self.browser.sleep(100);
			self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']/div/input")).then(function(val) {
				assert.ok(!val, "Input error");
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']")).click();
			self.browser.sleep(100);
			self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']/div/input")).then(function(val) {
				assert.ok(!val, "Input error");
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='withdrawal']")).click();
			self.browser.sleep(100);
			self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='withdrawal']/div/input")).then(function(val) {
				assert.ok(!val, "Input error");
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='total']")).click();
			self.browser.sleep(100);
			self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='total']/div/input")).then(function(val) {
				assert.ok(!val, "Input error");
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[1]")).click();
			self.browser.sleep(100);
			self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[1]/div/input")).then(function(val) {
				assert.ok(!val, "Input error");
			});
			self.done();
		});

		it("Input data starting from date using tab key.", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']/div")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(Key.TAB);

			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input")).sendKeys(tr.path);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='deposit']//input")).sendKeys(tr.deposit);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);

			//
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input")).sendKeys(tr.deposit);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);
			
			//
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='path']//input")).sendKeys(tr.split3n);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='deposit']//input")).sendKeys(tr.split3v);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);
			
			//
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path']//input")).sendKeys(tr.split4n);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='withdrawal']//input")).sendKeys(tr.split4v);
			//delete
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td/a")).click();
			//save
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='withdrawal']//input")).sendKeys(Key.RETURN);
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div")).click();
			//check Disballance row
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path' and contains(., 'Disballance')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit' and contains(., '" + tr.split4v + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td"));
			self.done();
		});

		it("Accounts page should have right ballance", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);
			self.browser.findElement(By.linkText("View")).click();	
			self.browser.findElement(By.linkText("Accounts")).click();	
			self.browser.findElement(By.xpath("//a[contains(.,'" + tr.name1 + "')]"));	
			self.browser.findElement(By.xpath("//li[contains(./div/a,'" + tr.name1 + "')]//div[contains(./a,'" + tr.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ 0.00')]]/a[contains(.,'" + tr.name1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr.deposit + "')]]/a[contains(.,'" + tr.name2 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'-$ " + tr.deposit + "')]]/a[contains(.,'" + tr.name + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'-$ " + tr.split4v + "')]]/a[contains(.,'" + tr.split4n1 + "')]"));
			self.browser.findElement(By.xpath("//div[span[contains(.,'$ " + tr.split4v + "')]]/a[contains(.,'Disballance')]"));
			self.done();
		});
		
		it("Add transaction", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[5];
			self.browser.findElement(By.xpath("//div[@id='acc_row']/a[contains(.,'" + tr.name + "')]")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']"));
			});
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='date']//input")).sendKeys(tr.date);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='num']//input")).sendKeys(tr.num);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='description']//input")).sendKeys(tr.description);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).clear();
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(tr.path);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id='blank']/td[@data-name='deposit']//input")).sendKeys(tr.deposit + '\n');
			var tmp1 = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp1 = !isPresent; } );
				return tmp1;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']/div[.='" + tr.date +"']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='num']/div[.='" + tr.num + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='description']/div[.='" + tr.description + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='path']/div[.='" + tr.path + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='deposit']/div[.='" + tr.deposit + "']"));
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='total']/div[.='" + tr.total + "']"));
			self.done();
		});

		it("Click on row with two splits.", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[5];
			self.browser.findElement(By.xpath("//label[contains(., 'Split')]/input")).click();
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='num']")).click();
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][1]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][2]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][3]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][3]/td[@data-name='path' and .='']"));
			
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][2]/td[@data-name='path' and contains(.,'" + tr.parent + "::" + tr.name + "')]"));
			self.done();
		});

		it("Click on row with three splits.", function(done) {
			var self = this;
			self.trackError(done);
			var tr = self.fixtures.dataentry.trs[5];
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']")).click();
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][1]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][2]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][3]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][4]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][5]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][5]/td[@data-name='path' and .='']"));
			
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][2]/td[@data-name='path' and contains(.,'" + tr.parent + "::" + tr.name + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split') and not(contains(@style, 'none'))][4]/td[@data-name='path' and contains(.,'Disballance')]"));
			self.done();
		});
	
		it("Edit data starting from date using tab key.", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);
			//check ballance before
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][1]/td[@data-name='total' and contains(., '" + tr.t1 + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][2]/td[@data-name='total' and contains(., '" + tr.t2 + "')]"));

			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='date']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank']/td[@data-name='date']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']/div/input"));
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='description']//input")).sendKeys(Key.TAB);

			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][1]/td[@data-name='withdrawal']//input")).sendKeys(Key.TAB);

			//
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='num']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='num']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='description']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='description']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input")).clear();
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input")).sendKeys(tr.v2);
			
			//save
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][2]/td[@data-name='withdrawal']//input")).sendKeys(Key.RETURN);
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			//check ballance after
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][1]/td[@data-name='total' and contains(., '" + tr.t3 + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][2]/td[@data-name='total' and contains(., '" + tr.t4 + "')]"));
			//check Disballance row
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path' and contains(., 'Disballance')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit' and contains(., '" + (parseFloat(tr.split4v) + parseFloat(tr.deposit)) + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td"));
			self.done();
		});

		it("Add data.", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);

			//
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path']//input")).sendKeys(tr.split3n);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path']//input")).sendKeys(Key.RETURN);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='deposit']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='deposit']//input")).sendKeys(Key.TAB);
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input")).sendKeys(tr.split3v);
			//save
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input")).sendKeys(Key.RETURN);
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			//check ballance after
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][1]/td[@data-name='total' and contains(., '" + tr.t3 + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][2]/td[@data-name='total' and contains(., '" + tr.t4 + "')]"));
			//check Disballance row
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path' and contains(., 'Disballance')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit' and contains(., '" + (parseFloat(tr.split4v) + parseFloat(tr.split3v) + parseFloat(tr.deposit)) + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path' and contains(., '" + tr.split3n + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal' and contains(., '" + tr.split3v + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][6]/td"));
			self.done();
		});

		it("Edit data and save by click in another row", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);

			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input"));
			});
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input")).clear();
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal']//input")).sendKeys(tr.split4v);
			//save
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][2]/td[@data-name='path']/div")).click();
			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			self.browser.findElement(By.xpath("//tr[@data-id!='blank'][1]/td[@data-name='path']/div")).click();
			//check ballance after
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][1]/td[@data-name='total' and contains(., '" + tr.t3 + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][2]/td[@data-name='total' and contains(., '" + tr.t4 + "')]"));
			//check Disballance row
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path' and contains(., 'Disballance')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='deposit' and contains(., '" + (parseFloat(tr.split4v) + parseFloat(tr.split4v) + parseFloat(tr.deposit)) + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='path' and contains(., '" + tr.split3n + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td[@data-name='withdrawal' and contains(., '" + tr.split4v + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][6]/td"));
			self.done();
		});
		
		it("Delete split row", function(done) {
			var self = this;
			var tr = self.fixtures.dataentry.trs[5];
			self.trackError(done);
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td/a")).click();

			var tmp = false;
			self.browser.wait(function () {
				self.browser.isElementPresent(By.xpath("//div[@class='blockUI blockOverlay']")).then(function (isPresent)
						 { tmp = !isPresent; } );
				return tmp;
			});
			//check ballance after
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][1]/td[@data-name='total' and contains(., '" + tr.t3 + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record ')][2]/td[@data-name='total' and contains(., '" + tr.t4 + "')]"));
			//check Disballance row
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='path' and contains(., 'Disballance')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][3]/td[@data-name='deposit' and contains(., '" + (parseFloat(tr.split4v) + parseFloat(tr.deposit)) + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='path' and contains(., '" + tr.split3n + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][4]/td[@data-name='withdrawal' and contains(., '" + tr.split4v + "')]"));
			self.browser.findElement(By.xpath("//tr[contains(@class, 'acc-item-record-split')][5]/td"));
			self.done();
		});
	});
	describe("Reports", function () {
		it("Login as user", function(done) {
			var self = this;
			self.trackError(done);
			self.restoreDb('cash-gnucash');	
			helpers.login.call(self, self.fixtures.dataentry.users[0], true);
			self.browser.findElement(By.linkText("Cash module")).click();						
			self.done();
		});	
		it ("Check barchart", function(done){
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.linkText("Report")).click();	
			self.browser.findElement(By.linkText("Spend/receive bar chart")).click();
			self.browser.wait(function () {
				return self.browser.isElementPresent(By.id("highcharts-0"));
			});	
			self.done();
		});
		it ("Check Accounts selection", function(done){
			var self = this;
			self.trackError(done);			
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(_.contains(arr, "Электричество"), "lost account");
						}
					});
				});			
			});			
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {				
		        modal.findElement(By.xpath("//span[text()='Электричество']")).click();						
				modal.findElement(By.id("save")).click();
			});
				self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(!_.contains(arr, "Электричество"), "lost account");
						}
					});
				});			
			});	
			self.done();
		});
		it ("Check Colapse level", function(done){
			var self = this;
			self.trackError(done);			
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(_.contains(arr, "Электричество"), "lost account");
						}
					});
				});
			});			
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {				
		       self.browser.executeScript("$('select[name=\"accLevel\"]').val('1')");
		       modal.findElement(By.id("save")).click();
			});
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(!_.contains(arr, "дом"), "lost account");
						}
					});
				});
			});	
			self.done();
		});
		it ("Check MaxAccounts", function(done){
			var self = this;
			self.trackError(done);			
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				var canstart = false;
				var end = false;
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						if (!canstart && !end){
							if (text.indexOf("Other")!=-1)
								canstart = true;
						}
						else if (canstart){
							if (text.indexOf("1.2011")!=-1)
								arr.push(text);	
							else{
								canstart = false;
								end = true;
							}	
						}										
						if (counter++ == elems.length){							
							assert.ok(arr.length==10, "acc number");
						}
					});
				});
			});			
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {	
				modal.findElement(By.linkText("General")).click();
				helpers.fillInput.call(modal, modal.findElement(By.name("maxAcc")), "3");				
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElements(By.tagName("tspan")).then(function(elems){	
				var arr =[]; 	
				var counter = 0;			
				var canstart = false;
				var end = false;		
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						if (!canstart && !end){
							if (text.indexOf("Other")!=-1)
								canstart = true;
						}
						else if (canstart){
							if (text.indexOf("1.2011")!=-1)
								arr.push(text);	
							else{
								canstart = false;
								end = true;
							}	
						}										
						if (counter++ == elems.length){							
							assert.ok(arr.length==3, "acc number");
						}
					})
				})	
			})	
			self.done();
		})		
		it ("Check Account type", function(done){
			var self = this;
			self.trackError(done);			
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(!_.contains(arr, "Особый Bank"), "acc type");
						}
					})
				})			
			});			
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {				
		       self.browser.executeScript("$('select[name=\"accType\"]').val('BANK')");
		       modal.findElement(By.id("save")).click();
			});
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(_.contains(arr, "Особый Bank"), "acc type");
						}
					})
				})			
			});	
			self.done();
		})	
		it ("Check Currency", function(done){
			var self = this;
			self.trackError(done);			
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(_.contains(arr, "-50000.00"), "currency");
						}
					})
				})			
			});			
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {
				modal.findElement(By.linkText("General")).click();				
				self.browser.executeScript("$('select[name=\"reportCurrency\"]').val('USD')");
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElements(By.tagName("tspan")).then(function(elems){				
				var arr =[]; 	
				var counter = 0;			
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);
						if (counter++ == elems.length){							
							assert.ok(_.contains(arr, "-1636.50"), "currency");
						}
					})
				})			
			});	
			self.done();
		})	
		it ("Check date range", function(done){
			var self = this;
			self.trackError(done);
			self.browser.findElement(By.id("page_menu")).click();	
			self.browser.findElement(By.id("settings")).click();
			helpers.runModal.call(self, null, function(modal) {	
				modal.findElement(By.linkText("General")).click();
				helpers.fillInput.call(modal, modal.findElement(By.name("startDate")), "03/01/2012");
				helpers.fillInput.call(modal, modal.findElement(By.name("endDate")), "05/01/2012");						
				modal.findElement(By.id("save")).click();
			});
			self.browser.findElements(By.tagName("tspan")).then(function(elems){	
				var arr =[]; 	
				var counter = 0;			
				var canstart = false;
				var end = false;		
				_.forEach(elems, function(elem){					
					elem.getText().then(function(text){						
						arr.push(text);													
						if (counter++ == elems.length){		
							assert.ok(!_.contains(arr, "2.2012"), "date range");					
							assert.ok(_.contains(arr, "3.2012"), "date range");
							assert.ok(_.contains(arr, "4.2012"), "date range");
							assert.ok(_.contains(arr, "5.2012"), "date range");
							assert.ok(!_.contains(arr, "6.2012"), "date range");
						}
					})
				})	
			})	
			self.done();
		})						
	})
	describe.skip("Settings", function () {
		it("TBD")
	})
	
})
