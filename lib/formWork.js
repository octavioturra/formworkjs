var formWork = function(){	
		var FormWorkError = function(index, complement){
			return Error("Error:" + index + ' ' + complement);
		};
		
		var lock = {};
		
		var helpers = {
			render : function($object, dataSource, trigger, renderMode){
				var target = $object.data().renderTarget||$object;
				
				var mode = $object.data().renderMode||"html";
				
				if($object.data().contentTemplate||renderMode==='template'){
					this._template($object, target, dataSource, mode, trigger);
				}else{
					this._html($object, dataSource, target, mode, trigger);
				}
			},
			_template : function($object, dataSource, target, mode, trigger){
				if(!dataSource){
					return "";
				}
				var template = $object.data().contentTemplate;
				var templateUrl = $object.data().contentTemplateUrl;
				if(templateUrl){
					$.ajax({
						url : templateUrl,
						async : false,
					});
					return;
				}
				var templateQuery = $object.data().contentTemplateQuery;
				if(templateId){
					var templateString = $(templateQuery).html();
					var content = _template(templateString, dataSource);
					$(target)[mode](content).trigger(trigger);
				}
			},
			_html : function($object, dataSource, target, mode, trigger){
				$(target)[mode](dataSource).trigger(trigger);
			},
			parseSplats : function($object, url){					
				var value = $object.val();
				url = url.replace(/:value/gi, value);
				
				var splats = url.match(/:\w+/gi);
				for(var splat in splats){
					var replacer = $object.attr(splats[splat].replace(':',''));
					if(!replacer){
						throw new FormWorkError(4, splats[splat]);
					}
					url = url.replace(splats[splat], replacer);
				}
				return url;
			},
			getDataSource : function(dataSource, type){
				if(!type){
					var type = 'object';
				}
				switch(type){
					case 'object' : return (window[dataSource])?window[dataSource]:''; break;
				}
				throw new FormWorkError(7, dataSource);
			},
			setHashChange : function(hash, callback){
				var hashAction = function(){
					
				}
				
				var lock = false;
				if(!lock){
					$(window).on('hashchange', hashAction);
					lock = true;
				}
			},
			waiting : function(action){
				
			},
			link : function($namespace, container){
				if(typeof container !== 'object'){
					if(window[container]){
						return window[container];
					}else{
						throw new FormWorkError(9);
					}
				}
				$namespace.container = container;
				$namespace.find("input, select, textarea").each(function(){
					this.on('change', function(){
						var that = this;
						var id = this.attr('id');
						var prefix = "";
						var advancedMode = false;
						if(typeof container.__defineSetter__ === 'function'){
							prefix = "_";
							advancedMode = 'ie';
						}else if(typeof Object.defineProperty === 'function'){
							prefix = "_";
							advancedMode = 'webkit-moz';
						}
						
						this.on('change',function(){
							var itemName = id.charAt(0).toUpperCase() + id.slice(1);
							container[prefix + itemName] = that.val();
							var setterName = 'set' + itemName;
							container[setterName] = function(value){
								this[prefix+itemName] = value;
								that.val(value);
								$namespace("storageChange", container);
								return value;
							};
							var getterName = 'get' + itemName;
							container[getterName] = function(){
								return that[prefix+itemName];
							};
							
							if(advancedMode==='webkit-moz'){
								container.__getfineGetter__(itemName,function(){
									return container[getterName]();
								});
								container.__defineSetter__(itemName, function(value){
									container[setterName](value);
								});
							}else if(advancedMode==='ie'){
								Object.defineProperty(container, itemName, {
									get : container[getterName],
									set : container[setterName]
								});
							}
						});
					})
				})
			}
		};
	
		var actions = {
			contentSource : {
				action : function($){
					var that = this;
					var url = this.data().contentSource;
					var dataSource = this.data().contentSourceData;
					if(!url){
						throw new FormWorkError(1);
					}
					var parseMode = this.data().contentSourceParser||"html";
					url = helpers.parseSplats(that, url);
					$.get(url, helpers.getDataSource(dataSource), function(d){
						helpers.render(that, d, 'contentSourceLoaded');
					}, parseMode);
					return;
				}
			},
			insertInto : {
				action : function($){
					var that = this;
					var $target = $(this.data().insertInto);
					
					if($target.length==0){
						throw new FormWorkError(3);
					}
					
					var targetEvent = this.data().insertIntoEvent||"change";
					
					var dataSource = this.data().insertIntoDataSource;
					
					var url = this.data().insertIntoSource;
					var obj = that.data().targetSourceObject;
					
					this.on(targetEvent, function(){
						if(url){
							url = helpers.parseSplats(that, url);
							var targetSourceMethod = that.data().targetSourceMethod||'get';
							var parseMode = that.data().contentSourceParser||"html";
							
							$[targetSourceMethod](url, helpers.getDataSource(dataSource), function(d){
								helpers.render($target, d, 'insertIntoFinished');
							}, parseMode);
						}else if(obj){
							helpers.render($target, window[obj], 'insertIntoFinished', 'template');
						}else{
							throw new FormWorkError(2);
						}
					});
				}
			},
			hashLoad : {//TERMINAR
				action : function($){
					var hashLoad  = this.data().hashLoad;
					var url = this.data().hashLoadUrl;
					if(!url){
						throw new FormWorkError(6, hashLoad);
					}
					if(!lock[this.id]){
						lock[this.id] = {
							configured : false,
						}
					}
					if(!lock[this.id].configured){
						lock[this.id].configured = true;
						
					}
				}
			},
			loadInto : {
				tagName : 'a',
				action : function($){
					var that = this;
					this.on('click', function(){
						helpers.waiting('start',$target);
						
						var $target = $(that.data().loadInto);
						if(target.length===0){
							throw new FormWork(7);
						}
						
						var method = that.data().loadMethod||'get';
						var mode = that.data().loadMethod||'html';
						
						var dataSourceName = that.data().loadSource;
						var dataSource = helpers.getDataSource(dataSourceName);
						
						
						var url = that.attr("href");
						
						$[method](url, dataSource, function(data){
							helpers.waiting('stop',$target);
							helpers.render(
								$target, 
								data, 
								'loadIntoFinished'
							);
						});
						
						return false;
					});
				}
			},
			submitInto : {//TESTAR
				tagName : 'form',
				action : function($){
					var that = this;
					var url = this.attr('action');
					var $target = $(this.data().target);
					if($target.length===0){
						throw new FormWork(8);
					}
					var method = (this.attr("method")||'get').toLowerCase();
					var data = this.serialize();
					this.on('submit', function(ev){
						helpers.waiting('start', $target);	
						$[method](url, data, function(d){
							helpers.waiting('stop', $target);
							helpers.render(
							$target, 
							data, 
							'submitIntoFinished'
							);
						});
						return false;
					})
				}
			},
			container : {
				tagName : 'form, fieldset',
				action : function(){
					var that = this;
					var container = this.data().container;
					helpers.link(this, container);
				}
			},
			partialStorage : {
				tagName : 'fieldset',
				action : function($){
					var type = this.data().storageType||'local';
					var persistAction = {
						local : function(db, data){
							
							
						},
						remote : function(url, data){
							
							
						}
					};
					var data;
				}
			}
		};
		
		var getDataQueryStringId = function(dataName, tagName){
			var selectors = tagName.split(',');
			var query = '';
			for(var selector in selectors){
				query += selectors[selector] + "[data-" + dataName
					.match(/([A-Z]?[a-z]+)/g)
					.join("-")
					.toLowerCase() + "], ";
			}
			return query.substr(0, query.length-2);
		};
		
		var initialize = function(queryResult, actions){
			if(queryResult.length==0){
				return;
			}
			for(var action in actions){
				var queryString = getDataQueryStringId(action, actions[action].tagName||'');
				$object = $(queryResult)
					.find(queryString);
				if($object.length===0){
					continue;
				}
				actions[action].action = _.bind(actions[action].action, 
					$object, 
					$);
				actions[action].action();
			}
		};
		
		return function(){
			initialize(this, actions);
			return this;
		};
	}
	jQuery.fn.extend({
		formWork : formWork()
	})