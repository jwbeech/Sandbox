/**
 * Creates object hierarchies so that classes don't conflict.
 * Every javascript file needs to register its code using this method and the classpath must represent the file path and file name.
 * e.g. com/flexifin/Utils.js = registerClasspath("dir1.flexifin.Utils", {});
 *
 * @param classPath The classpath string that matches the directory structure and file name
 * @param obj The object / class / util to be registered
 */
function registerClasspath(classPath, obj){
	_.setOnObject(window, classPath, obj);
	/*
	if (_.getOnObject(window, classPath) != null){
		//throw new Error("There is already a class registered with the classpath: " + classPath);
	}
	else{
		_.setOnObject(window, classPath, obj);
	}*/
}

