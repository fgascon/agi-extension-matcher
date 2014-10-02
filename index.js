var merge = require('utils-merge');

var proto = {};

proto.handle = function(req, res, out){
	var stack = this.stack,
		index = 0;
	
	function next(err){
		if(err){
			// delegate error to parent
			return out(err);
		}
		
		var layer = stack[index++];
		
		// all done
		if(!layer || res.done){
			// delegate to parent
			return out();
		}
		
		if(layer.regexp.test(req.extension)){
			layer.handle(req, res, next);
		}else{
			next();
		}
	}
	next();
};

var allwaysTrueRegExp = {
	test: function(){
		return true;
	}
};

proto.on = function(pattern, handler){
	var regexp;
	if(typeof pattern === 'string'){
		if(pattern === '*'){
			regexp = allwaysTrueRegExp;
		}else{
			regexp = new RegExp('^'+pattern+'$', 'i');
		}
	}else if(typeof pattern.test === 'function'){
		regexp = pattern;
	}else{
		throw new Error("Invalid pattern: "+pattern);
	}
	this.stack.push({
		regexp: regexp,
		handle: handler
	});
	return this;
};

module.exports = function(){
	function matcher(req, res, next){
		matcher.handle(req, res, next);
	}
	merge(matcher, proto);
	matcher.stack = [];
	return matcher;
};