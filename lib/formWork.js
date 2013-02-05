var formWork = function(){	
	var $context;
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
		randomIndex : function(radix, base){
			return (Math.random() * 9999 % radix).toFixed(0).toString(base);
		},
		key : function($object){
			var index = this.randomIndex(999, 19);
			var key = {
				index : index,
				selector : '[data-key=' + index + ']'
			};
			$object.attr('data-key', key.index);
			$object.attr('data-key-selector', key.selector);
			
			return $object;
		},
		link : function($namespace, container){
			if(typeof container !== 'string'){
				return window[container]
			}
			if(typeof window[container]!=='object'){
				window[container] = {};
			}
			$namespace.container = container;
			container = window[container];
			$namespace.find("input, select, textarea").each(function(){
				var $that = $(this);
				
				var id = $that.attr('id');
				var prefix = "";
				var advancedMode = false;
				if(typeof Object.defineProperty === 'function'){
					prefix = "_";
					advancedMode = true;
				}
				
				var itemName = id.charAt(0).toUpperCase() + id.slice(1);
								
				var setterName = 'set' + itemName;
				container[setterName] = function(value){
					container[prefix+itemName] = value;
					$that.val(value);
					$namespace.trigger("storageChange", container);
					return value;
				};
				
				var getterName = 'get' + itemName;
				container[getterName] = function(){
					return container[prefix+itemName];
				};
				
				if(advancedMode){
					Object.defineProperty(container, id, {
						get : container[getterName],
						set : container[setterName]
					});
				}
				
				$that.on('change', function(){
					container[id] = $(this).val();
				})
			})
		}, 
		getContainerData : function(container){
			var data = {};
			var keys = _.filter(_.keys(container), function(key){
				if(key.match(/_/)){
					return key;
				}
			});
			_.each(keys, function(key){
				var value = container[key];
				if(value){
					data[key.replace("_", '')] = value;
				}
			})
			return data;
		}
	};

	var classActions = {
	    cnpj :
            {
                tagName: "input",
                action: function ($) {
                    if (this.data().configured) {
                        return;
                    }
                    this.data().configured = true;
                    this.on('blur', function () {
                        
                    }).mask("99.999.999/9999-99");
                }
            },
	    cpf:
            {
                tagName: "input",
                action: function ($) {
                    if (this.data().configured) {
                        return;
                    }
                    this.data().configured = true;
                    this.mask("999.999.999-99");
                }
            },
	}

	var actions = {
		loadedFrom : {//CARREGA O URL url NA TAG COM data-loaded-from="url"
			action : function($){
				var $that = $(this);
				var url = this.data().loadedFrom;
				var event = this.data().loadedEvent;
				var dataSource = this.data().loadedDataSource;
				var data = helpers.getDataSource(dataSource);
				var load = function(){
					$.get(url, data, function(d){
						$that.html(d);
					});
				}
				if(event){
					$(document).on(event, function(){
						load();
					});
					return;
				}
				load();
			}
		},
		eventEmit : {//EMITE UM EVENTO evento AO CLICAR NO a OU button COM data-event-emit="evento"
			tagName : 'a, button',
			action : function($){
				var $that = $(this);
				var event = this.data().eventEmit;
				$(this).on('click', function(){
					$(document).trigger(event);
				});
			}
		},
		contentSource : {//CARREGA O RESULTADO VINDO DA url NA TAG COM data-content-source="url"
			action : function($){
				var that = this;
				var url = this.data().contentSource;//URL
				var dataSource = this.data().contentSourceData;//OBJETO EM window : data-content-source-data
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
		insertInto : {//NO EVENTO onchange OU data-target-event CARREGA url DE data-insert-into-source EM data-insert-into="#query"
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
				
				$context.on(targetEvent, this.selector, function(){
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
		hashLoad : {//NÃO FUNCIONA
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
		loadInto : {//LINK a CARREGANDO COM AJAX EM data-load-into="#query"
			tagName : 'a',
			action : function($){
				var that = this;	
				$context.on('click', this.selector, function(){
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
		submitInto : {//NÃO FUNCIONA
			tagName : 'form',
			action : function($){
				var that = this;
				if(that.data().configured){
					return;
				}
				
				var url = this.attr('action');
				var $target = $(this.data().target);
				if($target.length===0){
					throw new FormWork(8);
				}
				var method = (this.attr("method")||'get').toLowerCase();
				var data = this.serialize();
				$context.on('submit', this.selector, function(ev){
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
		container : {//NÃO FUNCIONA
			tagName : 'form, fieldset',
			action : function(){
				var that = this;
				var container = this.data().container;
				helpers.link(this, container);
			}
		},
		partialStorage : {//NÃO FUNCIONA
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
	
	var getDataQueryStringId = function (dataName, tagName, type) {
	    var prefix= "[data-";
	    var sulfix = "], ";

	    if (type === 'class') {
	        prefix = ".";
	        sulfix = ", ";
	    }

		var selectors = tagName.split(',');
		var query = '';
		for(var selector in selectors){
			query += selectors[selector] + prefix + dataName
				.match(/([A-Z]?[a-z]+)/g)
				.join("-")
				.toLowerCase() + sulfix;
		}
		return query.substr(0, query.length - 2);
	};
	
	var initialize = function(queryResult, actions){
		if(queryResult.length==0){
			return;
		}
		for(var action in actions){
			var queryString = getDataQueryStringId(action, actions[action].tagName||'');
			
			$object = $(queryResult)
				.find(queryString);
			
			helpers.key($object);
			
			if($object.length===0){
				continue;
			}
			actions[action].action = _.bind(actions[action].action, 
				$object, 
				$);
			actions[action].action();
		}
	};
	
	var classInitialize = function (queryResult, actions) {
	    var configure = function () {
	        if (queryResult.length == 0) {
	            return;
	        }
	        for (var action in actions) {
	            var queryString = getDataQueryStringId(action, actions[action].tagName || '', 'class');

	            $object = $(queryResult)
                    .find(queryString);

	            helpers.key($object);

	            if ($object.length === 0) {
	                continue;
	            }
	            actions[action].action = _.bind(actions[action].action,
                    $object,
                    $);
	            actions[action].action();
	        }
	    }
	    $(document).ready(function () {
	        configure();
	    });
	}

	return function () {
		$context = $(this.selector).parent();
		initialize(this, actions);
		classInitialize(this, classActions);
		return this;
	};
}
jQuery.fn.extend({
	formWork : formWork()
})