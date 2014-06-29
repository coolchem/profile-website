
/**
 * RamaJS JavaScript Framework v1.0
 * DEVELOPED BY
 * Varun Reddy Nalagatla
 * varun8686@gmail.com
 *
 * Copyright 2014 Varun Reddy Nalagatla a.k.a coolchem
 * Released under the MIT license
 *
 * FORK:
 * https://github.com/coolchem/rama
 */

'use strict';

(function(window, document) {'use strict';

//All Constants
var APPLICATION = "$r.Application"
var PACKAGE_RAMA = "$r";
var R_APP = "rapp";
var R_COMP = "comp";

var STATES = "states";
var LAYOUT = "layout";

var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
var MOZ_HACK_REGEXP = /^moz([A-Z])/;

"use strict";

var $r;
var packages = {};
var classes = {};
var skins = {};


$r = window.$r = constructPackage(PACKAGE_RAMA);

var RClass = function () {

    var constructors = [];

    this.isA = function(constructorFunction){

        for(var i=0; i< constructors.length; i++)
        {
            if(constructorFunction === constructors[i])
                return true;
        }
        return false
    }

    this.get = function (propertyName, getter) {

        Object.defineProperty(this, propertyName,
                {   get:getter,
                    enumerable:true,
                    configurable:true
                });
    }

    this.set = function (propertyName, setter) {

        Object.defineProperty(this, propertyName,
                {   set:setter,
                    enumerable:true,
                    configurable:true
                });
    }

    this.bind = function (fn) {

        return bindFunction(fn, this)
    }

    this.__addConstructor__ = function(constructor){
        constructors.push(constructor);
    }
};


function rPackage(packageName) {

    var rPackage = packages[packageName];
    if (rPackage)
        return rPackage;
    else {
        return constructPackage(packageName);
    }
}
;

//core functions
function constructPackage(packageName) {

    var rPackage = {};
    rPackage.packageName = packageName;

    rPackage.skins = function () {

        for (var i in arguments) {
            var skinItem = arguments[i];
            skins[getQualifiedName(this, skinItem.skinClass)] = skinItem;
        }
    };

    rPackage.Class = function (className) {

        var returnFunction = function (constructorFunction) {

            setupClass(rPackage, className, constructorFunction)
        }

        returnFunction.extends = function (qualifiedClassName) {

            return function (constructorFunction) {

                setupClass(rPackage, className, constructorFunction, qualifiedClassName)
            }
        }

        return returnFunction;
    }

    packages[packageName] = rPackage;

    return rPackage;

}

function setupClass(rPackage, className, constructorFunction, superClassName) {

    var newConstructorFunction = function () {

        var superRef = null;
        var baseClass = null;
        var constructorArguments = null;
        var isBaseClassConstruction = false;

        if (arguments.length > 0 && arguments[0] !== undefined) {
            if (arguments[0] === "isBaseClassConstruction") {
                isBaseClassConstruction = true;
            }
            else {
                constructorArguments = arguments;
            }
        }

        if (superClassName && superClassName !== "") {
            baseClass = classFactory(superClassName);
        }


        if (!isBaseClassConstruction) {
            RClass.apply(this);
            this.__addConstructor__(this.constructor);
        }

        var tempSubClassInstance = {};
        RClass.apply(tempSubClassInstance);
        constructorFunction.apply(tempSubClassInstance);
        if (baseClass !== null) {
            baseClass.call(this, "isBaseClassConstruction");
            superRef = {};
            initializeSuperReference(superRef,tempSubClassInstance, this)
            this.__addConstructor__(baseClass);
        }

        constructorFunction.apply(this);


        this.className = getQualifiedName(rPackage, className);

        if (superRef) {
            processSuperReference(superRef, this);
        }

        if (!isBaseClassConstruction && this.init) {
            this.init.apply(this, constructorArguments);
        }
    }

    newConstructorFunction.className = getQualifiedName(rPackage, className);

    rPackage[className] = newConstructorFunction
}

function initializeSuperReference(superRef,subclassInstance, context){
    for (var propName in subclassInstance) {
        if (propName !== "get" && propName !== "set" && propName !== "bind" && propName !== "isA" && propName !== "__addConstructor__") {
            var propertyDescriptor = Object.getOwnPropertyDescriptor(context, propName);
            if (propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set"))) {
                for (var descriptorName in propertyDescriptor) {

                    if (typeof propertyDescriptor[descriptorName] === "function") {
                        propertyDescriptor[descriptorName] = bindFunction(propertyDescriptor[descriptorName], context);
                    }
                }
                Object.defineProperty(superRef, propName, propertyDescriptor)
            }
            else if (typeof context[propName] === "function") {
                superRef[propName] = bindFunction(context[propName], context);
            }
        }

    }
}

function processSuperReference(superRef, context){
    for (var propName in superRef) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(context, propName);
        if (propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set"))) {

            var newPrototypeDescripter = {};
            var basePropertyDescriptor = Object.getOwnPropertyDescriptor(superRef, propName);
            for (var descriptorName in propertyDescriptor) {

                if (basePropertyDescriptor !== undefined && basePropertyDescriptor.hasOwnProperty(descriptorName)) {
                    if (typeof propertyDescriptor[descriptorName] === "function" && typeof basePropertyDescriptor[descriptorName] === "function") {
                        newPrototypeDescripter[descriptorName] = superFunctionFactory(propertyDescriptor[descriptorName], context, superRef);
                    }
                    else {
                        newPrototypeDescripter[descriptorName] = basePropertyDescriptor[descriptorName];
                    }
                }
                else {
                    newPrototypeDescripter[descriptorName] = propertyDescriptor[descriptorName];
                }
            }
            Object.defineProperty(context, propName, newPrototypeDescripter)
        }
        else if (typeof context[propName] === "function") {
            context[propName] = superFunctionFactory(context[propName], context, superRef);
        }
    }
}

function superFunctionFactory(superFunction, context, superObj) {
    return function () {
        context.super = superObj;
        var ret = superFunction.apply(context, arguments);
        context.super = null;
        return ret;
    }
}

//qualified class name is full path to the Class [packageName][className]
function classFactory(qualifiedClassName) {
    var classConstructor = $r[qualifiedClassName];
    var packageAndLibrary = qualifiedClassName.split(".");

    if (packageAndLibrary.length > 1) {
        if (packages[packageAndLibrary[0]] === null || packages[packageAndLibrary[0]] === undefined) {
            throw new ReferenceError("Package Not Found Exception: The Package " + packageAndLibrary[0] + " could not be found\n" +
                    "Please Make sure it is registered.");
        }
        else {
            classConstructor = packages[packageAndLibrary[0]][packageAndLibrary[1]];
        }

    }

    if (typeof classConstructor !== "function" || classConstructor === null || classConstructor === undefined) {
        throw new ReferenceError("Class Not Found Exception: The Class " + qualifiedClassName + " could not be found\n" +
                "Please Make sure it is registered in the package " + packageAndLibrary[0]);
    }

    return classConstructor;
}

function Application(applicationname, constructor) {

    $r.Class(applicationname).extends("RApplication")(constructor);
}
;


function initApplications() {


    var appNodes = $r.find('[' + R_APP + ']');

    for (var i = 0; i < appNodes.length; i++) {
        var appNode = appNodes[i];
        var application = $r[appNode.getAttribute(R_APP)];

        if (application) {
            initApplication(application, appNode)
        }
    }


}

function initApplication(application, appNode) {

    var applicationManager = new ApplicationManager(application, appNode);
    applicationManager.initialize();

}

function ApplicationManager(applicationClass, appNode) {

    var appClass = applicationClass;

    this.application = null;
    this.applicationNode = appNode;


    this.initialize = function () {

        this.application = new appClass();
        if (appNode.attributes !== undefined && appNode.attributes.length > 0) {

            for (var j = 0; j < appNode.attributes.length; j++) {
                var attr = appNode.attributes[j];
                this.application.setAttribute(attr.name, attr.value);
            }
        }
        this.application.applicationManager = this;
        this.application.setAttribute("comp", appNode.getAttribute(R_APP));
        this.application.parentApplication = this.application;
        var parentNode = appNode.parentNode;
        parentNode.replaceChild(this.application[0], appNode);
        this.application.initialize();
    }

}


function getQualifiedName(rPackage, className) {
    return rPackage.packageName + "." + className
}


function skinFactory(qualifiedCLassName) {
    var skinNode = null;

    var skinClassItem = skins[qualifiedCLassName];

    if (skinClassItem === null || skinClassItem === undefined || skinClassItem.skinClass === null || skinClassItem.skinClass === "") {
        throw new ReferenceError("Skin Class Note Found Exception: The requested Skin Class " + qualifiedCLassName + " could not be found\n" +
                "Please Make sure it is registered properly in the package ");
    }
    else {
        var tempDiv = document.createElement('div');
        if (!skinClassItem.skin || skinClassItem.skin !== "") {
            if (skinClassItem.skinURL && skinClassItem.skinURL !== "") {

                skinClassItem.skin = getRemoteSkin(skinClassItem.skinURL);
            }
        }

        tempDiv.innerHTML = skinClassItem.skin;
        skinNode = tempDiv.children[0];
        tempDiv.removeChild(skinNode);
    }

    return skinNode;
}

function getRemoteSkin(skinURL) {

    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.open("GET", skinURL, false);
    xmlhttp.send();

    return xmlhttp.responseText;
}

function isDefined(value) {
    return typeof value !== 'undefined';
}

function bindFunction(fn, context) {
    return function () {
        return fn.apply(context, arguments);
    }
}

function camelCase(name) {
    return name.
            replace(SPECIAL_CHARS_REGEXP,function (_, separator, letter, offset) {
                return offset ? letter.toUpperCase() : letter;
            }).
            replace(MOZ_HACK_REGEXP, 'Moz$1');
}

function cleanWhitespace(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
            node.removeChild(child);
            i--;
        }
        if (child.nodeType == 1) {
            cleanWhitespace(child);
        }
    }
    return node;
}

function setupDefaultsForArguments(argumentsList, valuesList) {

    for (var i = 0; i < argumentsList.length; i++) {

        if (argumentsList[i] === undefined) {
            argumentsList[i] = valuesList[i];
        }
    }
}

$r.package = rPackage;
//All Core Components which are exposed

//All the functions and properties which are exposed
$r.classFactory = classFactory;
$r.skinFactory = skinFactory;
$r.Application = Application;
$r.isDefined = isDefined;
$r.bindFunction = bindFunction;
$r.camelCase = camelCase;
$r.cleanWhitespace = cleanWhitespace;
$r.arrayUtil = ArrayUtil();
$r.setupDefaultsForArguments =setupDefaultsForArguments;

$r.STATES = STATES;
$r.LAYOUT = LAYOUT;
$r.R_COMP = R_COMP;





$r.Class("Controller").extends("EventDispatcher")(function () {

    this.init = function (view, model) {

        this.super.init();

    };

})

$r.Class("Event")(function () {

    var event = null; // The custom event that will be created

    if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
    } else {
        event = document.createEventObject();
    }

    var _name,_bubbles,_cancellable;

    this.init = function (name, bubbles, cancellable) {

        _name = name;
        _bubbles = bubbles;
        _cancellable = cancellable;
    };

    this.getEventObject = function(){

        if (document.createEvent) {
            event.initEvent(_name, _bubbles, _cancellable);
        } else {
            event.eventType = _name;
        }

        event.eventName = _name;

        //setting all the public properties on the "this" to the event object
        for (var propName in this) {

            event[propName] = this[propName];
        }
        return event;

    }

} )

$r.Class("EventDispatcher")(function () {

    var eventListenersDictionary = {};

    this.init = function () {

        this[0] = document.createElement("event-dispatcher");
    };

    this.addEventListener = function (type, listener, useCapture) {
        if($r.isDefined(listener))
            listener = $r.bindFunction(listener, this);
        this[0].addEventListener(type,listener,useCapture);

        if(eventListenersDictionary[type] === undefined || eventListenersDictionary[type] === null)
        {
            eventListenersDictionary[type] = [];
        }

        eventListenersDictionary[type].push(listener);
    };

    this.removeEventListener = function (type, listener, useCapture) {
        this[0].removeEventListener(type, listener,useCapture);

        if(eventListenersDictionary[type] !== undefined && eventListenersDictionary[type] !== null)
        {
            var index = $r.arrayUtil.getItemIndex(listener,eventListenersDictionary[type])
            if(index > -1)
            {
                eventListenersDictionary[type].splice(index, 1)
            }

            if(eventListenersDictionary[type].length <= 0)
            {
                eventListenersDictionary[type] = null;
            }

        }
    };

    this.dispatchEvent = function (event) {

        var eventObject = event;
        if(event.getEventObject)
        {
            eventObject = event.getEventObject();
        }
        if (document.createEvent) {
            this[0].dispatchEvent(eventObject);
        } else {
            this[0].fireEvent("on" + eventObject.eventType, eventObject);
        }

    };

    this.hasEventListener = function(type){

        if(eventListenersDictionary[type] !== undefined && eventListenersDictionary[type] !== null)
        {
            return true;
        }

        return false;

    }

});




$r.Class("LayoutBase")(function () {

    this.target = null;

    this.updateLayout = function () {


    };
});

$r.Class("Model")(function () {

    var bindedPropertiesDictionary = {};
    var observedPropertiesDictionary = {};

    var handleBindingsAndObservers = this.bind(handleBindingsAndObserversFn);

    this.init = function (simpleObject) {

      if(simpleObject !== null && simpleObject !== undefined)
      {

      }

    };

    this.bindProperty = function(propertyName){

        createGettersAndSetters(propertyName,this);
        var returnObj = {}

        returnObj.with = function (contextPropertyName, context) {

            if(!bindedPropertiesDictionary[propertyName])
            {
                bindedPropertiesDictionary[propertyName] = new $r.Dictionary();
                bindedPropertiesDictionary[propertyName].put(context,new $r.ArrayList([contextPropertyName]));
            }
            else
            {
                var propArray = bindedPropertiesDictionary[propertyName].get(context);
                if(!propArray){
                    bindedPropertiesDictionary[propertyName].put(context,new $r.ArrayList([contextPropertyName]));
                }
                else
                {
                   if(propArray.getItemIndex(contextPropertyName) === -1)
                   {
                       propArray.addItem(contextPropertyName);
                   }
                }
            }

        }

        return returnObj;

    }



    this.observe = function(propertyName, handler){

      createGettersAndSetters(propertyName,this);
      if(!observedPropertiesDictionary[propertyName])
      {
          observedPropertiesDictionary[propertyName] = new $r.ArrayList();

      }

      if(observedPropertiesDictionary[propertyName].getItemIndex(handler) === -1)
      {
          observedPropertiesDictionary[propertyName].addItem(handler);
      }
    }

    function createGettersAndSetters(propertyName,context){

        var propertyDescriptor = Object.getOwnPropertyDescriptor(context, propertyName);
        var propertyValue = context[propertyName];
        if (propertyDescriptor === undefined || !(propertyDescriptor.hasOwnProperty("get") && propertyDescriptor.hasOwnProperty("set")))
        {

            Object.defineProperty(context, propertyName,
                    {   set:setter,
                        get:getter,
                        enumerable:true,
                        configurable:true
                    });


        }

        function getter(){

            return propertyValue;
        }

        function setter(value){

            if(value != propertyValue)
            {
                propertyValue = value;
                handleBindingsAndObservers(propertyName);
            }


        }
    }

    function handleBindingsAndObserversFn(propertyName){

      if(observedPropertiesDictionary[propertyName] && observedPropertiesDictionary[propertyName].length > 0)
      {
          observedPropertiesDictionary[propertyName].forEach(function(item){
            item();
          })
      }

        if(bindedPropertiesDictionary[propertyName])
        {
            bindedPropertiesDictionary[propertyName].forEach(function(item){
                item.value.forEach(function(prop){

                    item.key[prop] = this[propertyName];

                }, this)
            })
        }
    }

});

$r.Class("ArrayList").extends("EventDispatcher")(function () {

    var isFunction = function (fn) {
        var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
        if (!isFunc && typeof window !== 'undefined') {
            isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
        }
        return isFunc;
    };

    this.init = function (source) {

        this.super.init();

    disableEvents();
    this.source = source;
    enableEvents();

    };

    var _dispatchEvents = 0

    var _source = null;

    this.get("source", function () {

        return _source;
    });

    this.set("source", function (s) {
        var i;
        var len
        _source = s ? s : [];
        len = _source.length;
        if (_dispatchEvents == 0) {
            var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
            event.kind = $r.CollectionEventKind.RESET;
            this.dispatchEvent(event);
        }
    });

    this.get("length", function () {

        if (_source)
            return _source.length;
        else
            return 0;
    });


    this.addItem = function (item) {

        this.addItemAt(item, this.length);
    };

    this.addItemAt = function (item, index) {

        if (index < 0 || index > this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        _source.splice(index, 0, item);
        internalDispatchEvent(this,$r.CollectionEventKind.ADD, item, index);
    }

    this.addAll = function (addList) {

        this.addAllAt(addList, this.length);
    }

    this.addAllAt = function (addList, index) {

        var length = addList.length;
        for (var i = 0; i < length; i++) {
            this.addItemAt(addList.getItemAt(i), i + index);
        }
    }

    this.getItemIndex = function (item) {
        return $r.arrayUtil.getItemIndex(item, _source);
    };

    this.removeItem = function (item) {
        var index = this.getItemIndex(item);
        var result = index >= 0;
        if (result)
            this.removeItemAt(index);

        return result;

    }

    this.removeItemAt = function (index) {

        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        var removed = _source.splice(index, 1)[0];

        internalDispatchEvent(this, $r.CollectionEventKind.REMOVE, removed, index);
        return removed;
    };

    this.removeAll = function () {

        if (this.length > 0) {
            _source.splice(0, this.length);
            internalDispatchEvent(this,$r.CollectionEventKind.RESET);
        }

    }

    this.toArray = function(){

        return _source.concat();
    }

    this.toString = function(){

        _source.toString();

    }

    this.getItemAt = function (index) {

        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        return _source[index];
    };

    this.setItemAt = function (item, index) {
        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        var oldItem = source[index];
        source[index] = item;

        if (_dispatchEvents == 0) {
            var hasCollectionListener = this.hasEventListener($r.CollectionEvent.COLLECTION_CHANGE);
            if (hasCollectionListener) {
                var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
                event.kind = $r.CollectionEventKind.REPLACE;
                event.location = index;
                var updateInfo = {};
                updateInfo.oldValue = oldItem;
                updateInfo.newValue = item;
                updateInfo.property = index;
                event.items.push(updateInfo);
                this.dispatchEvent(event);
            }
        }
        return oldItem;
    }


    this.refresh = function () {

    }

    this.forEach = function(fn,context){

        if (!isFunction(fn)) {
            throw new TypeError('iterator must be a function');
        }

        for(var i = 0; i < this.length; i++)
        {
            fn.call(context, this.source[i]);
        }

    }
    function enableEvents() {
        _dispatchEvents++;
        if (_dispatchEvents > 0)
            _dispatchEvents = 0;
    }


    function disableEvents() {
        _dispatchEvents--;
    }

    function itemUpdateHandler(event) {
        internalDispatchEvent(this,$r.CollectionEventKind.UPDATE, event);
    }

    function internalDispatchEvent(_this,kind, item, location) {
        if (_dispatchEvents == 0) {
            if (_this.hasEventListener($r.CollectionEvent.COLLECTION_CHANGE)) {
                var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
                event.kind = kind;
                event.items.push(item);
                event.location = location;
                _this.dispatchEvent(event);
            }

        }
    }


})

$r.Class("Dictionary")(function(){

    var dictionaryArray = [];

    var isFunction = function (fn) {
        var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
        if (!isFunc && typeof window !== 'undefined') {
            isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
        }
        return isFunc;
    };


    this.get = function(key){

        var item = getKeyItem(key);
        if(item !== undefined)
        {
            return item.value;
        }
    };
    this.put = function(key, value){

        var item = getKeyItem(key);
        if(item !== undefined)
        {
            item.value = value;
        }
        else
        {
            dictionaryArray.push({key:key, value:value});
        }
    };

    this.remove = function(key){
        for(var i = 0; i<dictionaryArray.length; i++)
        {
            var item = dictionaryArray[i];
            if(item.key === key)
            {
                dictionaryArray.splice(i, 1);
                break;
            }
        }
    };

    this.hasKey = function(key){
        var item = getKeyItem(key);
        if(item !== undefined)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    this.forEach = function(fn,context){

        if (!isFunction(fn)) {
            throw new TypeError('iterator must be a function');
        }

        for(var i = 0; i < dictionaryArray.length; i++)
        {
            fn.call(context, dictionaryArray[i]);
        }

    }

    function getKeyItem(key){

        for(var i = 0; i<dictionaryArray.length; i++)
        {
            var item = dictionaryArray[i];
            if(item.key === key)
            {
                return item;
            }
        }

    }


})

$r.Class("RApplication").extends("Component")(function () {

    this.applicationManager = null;

})


$r.Class("Component").extends("ComponentBase")(function () {

    var attachSkin,findSkinParts,detachSkin,clearSkinParts,
            validateSkinChange,validateSkinState;

    attachSkin = this.bind(attachSkinFn);
    detachSkin = this.bind(detachSkinFn);
    findSkinParts = this.bind(findSkinPartsFn);
    clearSkinParts = this.bind(clearSkinPartsFn);
    validateSkinChange = this.bind(validateSkinChangeFn);
    validateSkinState =  this.bind(validateSkinStateFn);

    var _skinChanged = false;

    this.init = function(){

        this.super.init();
    this.setAttribute("comp", "Component");
    }

    var _skinElement = null;

    var _skinClass;

    var _skinClassSet = false;

    this.get("skinClass", function () {
        return _skinClass;
    })

    this.set("skinClass", function (newValue) {

        if(_skinClass !== newValue)
        {
            _skinClass = newValue;
            if(_skinClassSet)
                validateSkinChange();
        }

        if(!_skinClassSet)
            _skinClassSet = true;

    })

    var _skinParts = [];
    this.get("skinParts", function () {
        return _skinParts;
    })

    this.set("skinParts", function (newValue) {
        defineSkinParts(newValue);
    })

    function defineSkinParts(skinPartss) {

        for (var i = 0; i < skinPartss.length; i++) {
            _skinParts.push(skinPartss[i]);
        }

    }

    var _currentState = "";

    this.get("currentState",function(){
        return _currentState

    })

    this.set("currentState",function(value){

        if(_currentState !== value)
        {
            _currentState = value;
            validateSkinState();
        }

    })

    this.$$createChildren = function () {
        validateSkinChange();
    };

    this.partAdded = function (partName, instance) {
        //Override this method to add functionality to various skin component
    };

    this.partRemoved = function (partName, instance) {
        //Override this method to add functionality to various skin component
    };

    function validateSkinStateFn(){

        if(_skinElement)
            _skinElement.currentState = _currentState;
    }

    function validateSkinChangeFn(){

        if (_skinElement)
            detachSkin();
        attachSkin();
    }

    function attachSkinFn() {

        if(this.skinClass)
        {
            _skinElement = new $r.Skin(this.skinClass);
            this.addElement(_skinElement);

            findSkinParts();
            validateSkinState();
        }
    }

    function detachSkinFn(){
        clearSkinParts();
        this.removeElement(_skinElement);
    }

    function clearSkinPartsFn(){

        if (_skinElement) {
            for (var j = 0; j < this.skinParts.length; j++) {
                var skinPart = this.skinParts[j];
                if(this[skinPart.id] !== null)
                {
                  this.partRemoved(skinPart.id, this[skinPart.id])
                }
            }
        }

    }

    function findSkinPartsFn() {
        if (_skinElement) {
            for (var j = 0; j < this.skinParts.length; j++) {
                var skinPart = this.skinParts[j];
                var skinPartFound = false;

                var skinPartElement = _skinElement.getSkinPart(skinPart.id);

                if (skinPartElement) {
                    skinPartFound = true;
                    this[skinPart.id] = skinPartElement;
                    this.partAdded(skinPart.id, skinPartElement)
                }

                if (skinPart.required === true && !skinPartFound) {
                    throw new ReferenceError("Required Skin part not found: " + skinPart.id + " in " + this.skin);
                }
            }
        }
    }

});

$r.Class("ComponentBase").extends("EventDispatcher")(function () {


    this.id = "";
    this.comp = "";
    this.initialized = false;
    this.parentApplication = null;

    var _elements = new $r.ArrayList();

    this.init = function () {

        this[0] = document.createElement("div");

    };

    this.get("textContent",function(){
            return this[0].textContent;

    })
    this.set("textContent",function(value){
        this[0].textContent = value;
    })

    this.get("elements",function(){
        return _elements

    })
    this.set("elements",function(value){
        _elements = value;
    })

    this.parentComponent = null;

    this.get("visibility",function(){
        return this.getStyle("visibility");

    })
    this.set("visibility",function(value){
        this.setStyle("visibility", value);
    })

    this.get("display",function(){
        return this.getStyle("display")

    })
    this.set("display",function(value){
        this.setStyle("display", value);
    })

    this.initialize = function () {

        if (this.initialized)
            return;
        this.$$createChildren();
        this.$$childrenCreated();
        this.initialized = true;
    };

    this.addElement = function (element) {
        this.addElementAt(element, _elements.length)

    };

    this.addElementAt = function (element, index) {

        if(index === -1)
        {
            index = 0;
        }

        if(_elements.length <= 0 || index > this.elements.length-1)
        {
            this[0].appendChild(element[0])
        }
        else
        {
            var refChild = _elements.source[index][0];
            this[0].insertBefore(element[0], refChild)
        }

        element.parentComponent = this;
        element.parentApplication = this.parentApplication;
        element.initialize();
        this.elements.addItemAt(element,index);

    };

    this.removeElement = function (element) {
        this.elements.removeItem(element);
        this[0].removeChild(element[0]);
    };

    this.removeAllElements = function (element) {

        this[0].innerHTML = "";
        this.elements = new $r.ArrayList();
    };

    this.replaceElement = function (element) {

        this[0].replaceChild(element);
    };

    this.hasAttribute = function(name){

        return this[0].hasAttribute(name);
    };

    this.getAttribute = function(name){

        return this[0].getAttribute(name);
    };


    this.setAttribute = function(name, value)
    {
        var nameAndState = name.split('.');
        var propertyName = $r.camelCase(nameAndState[0].toLowerCase());
        if(typeof this[propertyName] !== "function")
        {
            if(nameAndState.length === 1)
            {
                this[0].setAttribute(nameAndState[0], value);
                this[propertyName] = value;
            }
        }
    };

    this.setStyle = function(styleName, value){
            this[0].style[styleName] = value;
    }

    this.getStyle = function(styleName){
            return this[0].style[styleName];
    }


    this.$$createChildren = function () {

    };


    this.$$childrenCreated = function () {

        this.$$updateDisplay();

    };

    this.$$updateDisplay = function(){


    }

})

$r.Class("Container").extends("Component")(function () {

    var _htmlContent = [];
    this.get("htmlContent", function () {
        return _htmlContent;
    });

    this.set("htmlContent", function(newValue){

        _htmlContent = newValue;
    });

    this.skinParts = [
        {id:'contentGroup', required:false}
    ];

    this.contentGroup = null;

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "Container");

    }

    this.partAdded = function (partName, instance) {

        this.super.partAdded(partName, instance);

        if (instance === this.contentGroup) {
            this.contentGroup.htmlContent = this.htmlContent;
        }
    };

})

$r.Class("DataGroup").extends("GroupBase")(function () {


    var indexToRenderer = [];

    var setDataProvider,itemRemoved,itemAdded,dataProvider_collectionChangeHandler;


    setDataProvider = this.bind(setDataProviderFn);
    itemRemoved = this.bind(itemRemovedFn);
    itemAdded = this.bind(itemAddedFn);
    dataProvider_collectionChangeHandler = this.bind(dataProvider_collectionChangeHandlerFn);

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "DataGroup");
    }

    var _dataProvider = null;

    this.get("dataProvider", function () {

        return _dataProvider;
    });

    this.set("dataProvider", function (value) {

        if (_dataProvider == value)
            return;
        _dataProvider = value;
        setDataProvider()
        var event = new $r.Event("dataProviderChanged");
        this.dispatchEvent(event);


    });

    var _itemRenderer = null;

    this.set("itemRenderer", function (value) {

        if (typeof value === "string") {
            _itemRenderer = $r.classFactory(value)
        }
        else {
            _itemRenderer = value;
        }

    });


    this.get("itemRenderer", function () {

        return _itemRenderer;
    });

    var _itemRendererFunction = null;

    this.get("itemRendererFunction", function () {

        return _itemRendererFunction;
    });

    this.set("itemRendererFunction", function (value) {

        _itemRendererFunction = value;
    });


    this.initialize = function () {

        this.super.initialize();
        setDataProvider();

    };

    function setDataProviderFn() {
        if (this.initialized) {
            removeAllItemRenderers(this);
            createItemRenderers(this);
            addDataProviderListener();

            this.$$updateDisplay();
        }
    }


    function removeAllItemRenderers(_this) {

        _this.removeAllElements();
        indexToRenderer = [];

    }

    function addDataProviderListener() {
        if (_dataProvider)
            _dataProvider.addEventListener($r.CollectionEvent.COLLECTION_CHANGE, dataProvider_collectionChangeHandler, false, 0, true);
    }

    function removeDataProviderListener() {
        if (_dataProvider)
            _dataProvider.removeEventListener($r.CollectionEvent.COLLECTION_CHANGE, dataProvider_collectionChangeHandler);
    }


    function dataProvider_collectionChangeHandlerFn(event) {
        switch (event.kind) {
            case $r.CollectionEventKind.ADD:
            {
                // items are added
                adjustAfterAdd(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.REPLACE:
            {
                // items are replaced
                adjustAfterReplace(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.REMOVE:
            {
                // items are removed
                adjustAfterRemove(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.MOVE:
            {
                // one item is moved
                adjustAfterMove(event.items[0], event.location, event.oldLocation);
                break;
            }

            case $r.CollectionEventKind.REFRESH:
            {
                // from a filter or sort...let's just reset everything
                removeDataProviderListener();
                break;
            }

            case $r.CollectionEventKind.RESET:
            {
                // reset everything
                removeDataProviderListener();
                setDataProvider()
                break;
            }

            case $r.CollectionEventKind.UPDATE:
            {

                break;
            }
        }

        event.stopImmediatePropagation();

        this.$$updateDisplay();
    }


    function removeRendererAt(index) {
        var renderer = indexToRenderer[index];
        if (renderer) {
            var item;

            if (renderer.data && _itemRenderer != null)
                item = renderer.data;
            else
                item = renderer;
            itemRemoved(item, index);
        }
    }


    function itemRemovedFn(item, index) {
        // Remove the old renderer at index from indexToRenderer[], from the
        // DataGroup, and clear its data property (if any).

        var oldRenderer = indexToRenderer[index];

        if (indexToRenderer.length > index)
            indexToRenderer.splice(index, 1);

        /*        dispatchEvent(new RendererExistenceEvent(
         RendererExistenceEvent.RENDERER_REMOVE, false, false, oldRenderer, index, item));*/

        if (oldRenderer.data && oldRenderer !== item)
            oldRenderer.data = null;

        var child = oldRenderer;
        if (child)
            this.removeElement(child);
    }

    function createRendererForItem(item) {
        if (_itemRenderer != null) {
            var renderer = new _itemRenderer();
            renderer.data = item;
            return renderer
        }
        return null;
    }

    function createItemRenderers(_this) {
        if (!_dataProvider) {
            removeAllItemRenderers(_this);
            return;
        }

        var dataProviderLength = _dataProvider.length;

        // Remove the renderers we're not going to need
        for (var index = indexToRenderer.length - 1; index >= dataProviderLength; index--)
            removeRendererAt(index);

        // Reset the existing renderers
        for (index = 0; index < indexToRenderer.length; index++) {
            var item = _dataProvider.getItemAt(index);
            var renderer = indexToRenderer[index]

            removeRendererAt(index);
            itemAdded(item, index);
        }

        // Create new renderers
        for (index = indexToRenderer.length; index < dataProviderLength; index++)
            itemAdded(_dataProvider.getItemAt(index), index);

    }


    function itemAddedFn(item, index) {
        var myItemRenderer = createRendererForItem(item);
        indexToRenderer.splice(index, 0, myItemRenderer);
        this.addElementAt(myItemRenderer, index);
    }

    function adjustAfterAdd(items, location) {
        var length = items.length;
        for (var i = 0; i < length; i++) {
            itemAdded(items[i], location + i);
        }

        // the order might have changed, so we might need to redraw the other
        // renderers that are order-dependent (for instance alternatingItemColor)
        resetRenderersIndices();
    }


    function adjustAfterRemove(items, location) {
        var length= items.length;
        for (var i = length - 1; i >= 0; i--) {
            itemRemoved(items[i], location + i);
        }

// the order might have changed, so we might need to redraw the other
// renderers that are order-dependent (for instance alternatingItemColor)
        resetRenderersIndices();
    }

    /**
     *  @private
     */
    function adjustAfterMove(item, location, oldLocation) {
        itemRemoved(item, oldLocation);
        itemAdded(item, location);
        resetRenderersIndices();
    }

    /**
     *  @private
     */
    function adjustAfterReplace(items, location) {
        var length= items.length;
        for (var i= length - 1;i >= 0; i-- )
        {
            itemRemoved(items[i].oldValue, location + i);
        }

        for (i = length - 1; i >= 0; i--) {
            itemAdded(items[i].newValue, location);
        }
    }


    function resetRenderersIndices() {
        if (indexToRenderer.length == 0)
            return;
        var indexToRendererLength = indexToRenderer.length;
        for (var index = 0; index < indexToRendererLength; index++)
            resetRendererItemIndex(index);
    }

    function resetRendererItemIndex(index)
    {
        var renderer = indexToRenderer[index]
        if (renderer)
            renderer.itemIndex = index;
    }


})

$r.Class("Group").extends("GroupBase")(function () {


    var _htmlContent = [];

    this.get("htmlContent",function(){

        return _htmlContent;
    });

    this.set("htmlContent",function(newValue){

        _htmlContent = newValue;
        setHTMLContent(this);
    });

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "Group");

    }

    this.$$createChildren = function () {

        if (this.htmlContent.length > 0) {
            for (var i = 0; i < this.htmlContent.length; i++) {

                this.addElement(this.htmlContent[i]);
            }
        }
    };

    function setHTMLContent(_this) {
        if (_this.initialized) {
            _this.removeAllElements();
            _this.$$createChildren();
            _this.$$updateDisplay();
        }
    }
})

$r.Class("GroupBase").extends("ComponentBase")(function () {


    var _layout = null;

    this.get("layout",function(){

        return _layout;
    });

    this.set("layout",function(value){

        if(value)
        {
            _layout = value;
        }

    });

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "GroupBase");

    }

    this.$$updateDisplay = function(){

       if(_layout)
       {
           _layout.target = this;
           _layout.updateLayout();
       }
    }

})

$r.Class("Skin").extends("Group")(function () {

    var compileHTMLNode = this.bind(compileHTMLNodeFn);

    var skinStates = {};

    var _compiledElements = {};

    var stateManagedProperties = {};

    var _currentState = "";

    this.ownerComponent = null;

    this.get("currentState",function(){
        return _currentState

    })

    this.set("currentState",function(value){

        if(skinStates[value])
        {
            _currentState = value;
            skinStates[_currentState].apply();
        }
        else if(value !== "")
        {
            throw new ReferenceError("State not Found Exception: The state '" + value +
                    "' being set on the component is not found in the skin");
        }
    })

    this.init = function(skinClass){
        this.super.init();
        compileHTMLNode(this,$r.skinFactory(skinClass));
        this.setAttribute("comp", "Skin");
        for(var stateName in skinStates)
        {
            var state = skinStates[stateName];
            if(stateManagedProperties.hasOwnProperty(stateName))
            {
                state.registerComponents(stateManagedProperties[stateName])
            }
        }
    }

    this.getSkinPart = function (compId) {

        return _compiledElements[compId];
    }

    function createComponentFromNode(node){

        var componentClass = null;
        var component = null;
        if(node.getAttribute(R_COMP) !== undefined && node.getAttribute(R_COMP) !== null)
        {
            componentClass = $r.classFactory(node.getAttribute(R_COMP))
        }

        if (componentClass !== undefined && componentClass != null && componentClass !== "") {
            component = new componentClass();
        }
        else {
            component = new $r.Group();
        }

        component[0] = node;
        return component;
    }

    function compileHTMLNodeFn(component,node)
    {
        //applying node attributes
        if (node.attributes !== undefined && node.attributes.length > 0) {

            for (var j = 0; j < node.attributes.length; j++) {
                var attr = node.attributes[j];
                component.setAttribute(attr.name, attr.value);

                if(component !== this)
                    registerStateManagedComponents(component, attr.name, attr.value);
            }
        }

        if (node.children !== undefined && node.children.length > 0) {


            for (var i = 0; i < node.children.length; i++) {
                var childNode = node.children[i];

                var continueProcessingNode = true;
                if(component === this)
                {
                    if(childNode.tagName.toLowerCase() === $r.STATES)
                    {
                        for (var j = 0; j < childNode.children.length; j++)
                        {
                            var stateNode = childNode.children[j];
                            if(stateNode.getAttribute("name") !== null && stateNode.getAttribute("name") !== undefined)
                            {
                                var state = new $r.State(stateNode.getAttribute("name"), stateNode.getAttribute("stateGroups"));
                                skinStates[state.name] = state;
                            }
                        }

                        continueProcessingNode = false;
                    }
                }

                if(continueProcessingNode){
                    //checking if tag name matches a property name in the component and
                    //the property should be an array
                    var childNodeTagName = $r.camelCase(childNode.tagName.toLowerCase());
                    if(component[childNodeTagName] &&  component[childNodeTagName] instanceof Array)
                    {
                        for (var k = 0; k < childNode.children.length; k++)
                        {
                            var childComponent1 = createComponentFromNode(childNode.children[k]);
                            compileHTMLNode(childComponent1,childNode.children[k]);
                            component[childNodeTagName].push(childComponent1);
                        }

                    }
                    else if(childNodeTagName === $r.LAYOUT) //now checking if the child tag name is layout
                    {
                        //Removing layout support to be addressed later
                        /*                    var layoutClass = $r.classFactory(childNode.getAttribute("class"))
                         if(layoutClass)
                         {
                         component.layout = new layoutClass();
                         for (var j = 0; j < childNode.attributes.length; j++) {
                         var attr = childNode.attributes[j];
                         component.layout[$r.camelCase(attr.name)] = attr.value

                         if(component !== this)
                         registerStateManagedComponents(component.layout, attr.name, attr.value);
                         }
                         }*/


                    }
                    else
                    {

                        var childComponent = createComponentFromNode(childNode);
                        compileHTMLNode(childComponent,childNode);
                        if(component.htmlContent)
                        {
                            component.htmlContent.push(childComponent);
                        }
                    }
                }

            }

            //setting innerHTML to empty so that children are created through normal process
            component[0].innerHTML = "";
        }

        if(component !== this)
            registerSkinPart(component);

        return component;
    }

    function registerSkinPart(component) {

        var componentAttr = component.getAttribute("id");
        if (componentAttr !== null && componentAttr !== undefined && componentAttr !== "") {
            _compiledElements[componentAttr] = component;
        }
    }

    function registerStateManagedComponents(component, attrName, attrValue){
        var nameAndState = attrName.split('.');
        var propertyName = $r.camelCase(nameAndState[0].toLowerCase());
        if(typeof component[propertyName] !== "function")
        {
            if(nameAndState.length == 2)
            {
                var stateName = nameAndState[1].toLowerCase();
                if(stateManagedProperties[stateName] === undefined)
                {
                    stateManagedProperties[stateName] = [];
                }

                stateManagedProperties[stateName].push({component:component,propertyName:propertyName,value:attrValue})
            }
        }

    }

})



$r.Class("CollectionEvent").extends("Event")(function () {


    this.init = function (type, bubbles,cancelable,kind, location,
                                                       oldLocation, items) {

    $r.setupDefaultsForArguments([bubbles,cancelable,kind, location,
        oldLocation, items], [false, false,null,-1,-1,null]);

        this.super.init(type, bubbles, cancelable);
    this.kind = kind;
    this.location = location;
    this.oldLocation = oldLocation;
    this.items = items ? items : [];

    };

})

$r.CollectionEvent.COLLECTION_CHANGE = "collectionChange";
$r.CollectionEventKind = {
    ADD:"add",
    MOVE:"move",
    REMOVE:"remove",
    REPLACE:"replace",
    EXPAND:"expand",
    REFRESH:"refresh",
    RESET:"reset",
    UPDATE:"update"

}


function ArrayUtil(){

    var arrayUtil = {};
    arrayUtil.toArray = function(obj){
        if (obj == null)
            return [];

        else if (obj instanceof Array)
        {
            return obj;
        }
    else
        return [ obj ];
    }

    arrayUtil.getItemIndex = function(item, source){

        if(source instanceof Array)
        {
            var n = source.length;
            for (var i = 0; i < n; i++)
            {
                if (source[i] === item)
                    return i;
            }
        }
        return -1;

    }

    return arrayUtil;

}


$r.Class("State").extends("EventDispatcher")(function () {

    var _stateManagedComponents = [];
    var _name;
    this.get('name', function(){

        return _name;
    });

    var _stateGroups;
    this.get('stateGroups', function(){

        return _stateGroups;
    });

    this.init = function(name,stateGroups){
        this.super.init();
    _name = name;
    _stateGroups = stateGroups;
    }

    this.registerComponents = function(componentsArray){

        for(var i = 0; i<componentsArray.length; i++)
        {
            var componentItem = componentsArray[i];
            _stateManagedComponents.push(componentItem);
        }

    }

    this.apply = function(){

        for(var i = 0; i<_stateManagedComponents.length; i++)
        {
            var componentItem = _stateManagedComponents[i];

            componentItem.component[componentItem.propertyName] = componentItem.value;
        }

    }

})





$r.Class("ViewStack").extends("Group")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})



$r.Class("GridLayout").extends("LayoutBase")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})

$r.HorizontalAlign = {

    LEFT:"left",
    CENTER:"center",
    RIGHT:"right",
    JUSTIFY:"justify",
    CONTENT_JUSTIFY:"contentJustify"

}


$r.Class("HorizontalLayout").extends("LayoutBase")(function () {

    var paddingLeft = 10;
    var paddingRight = 10;
    var paddingTop = 10;
    var paddingBottom = 10;

    var verticalAlign = $r.VerticalAlign.TOP;

    var horizontalAlign = $r.HorizontalAlign.LEFT;

    this.updateLayout = function () {
        if(this.target)
        {
            var layoutTarget = this.target;
            var targetWidth = Math.max(0, layoutTarget.width - paddingLeft - paddingRight);
            var targetHeight = Math.max(0, layoutTarget.height - paddingTop - paddingBottom);

            var layoutElement
            var count = layoutTarget.elements.length;

           /* var containerHeight = targetHeight;
            if (verticalAlign == $r.VerticalAlign.CONTENT_JUSTIFY ||
                    (clipAndEnableScrolling && (verticalAlign == VerticalAlign.MIDDLE ||
                            verticalAlign == $r.VerticalAlign.BOTTOM)))
            {
                for (var i = 0; i < count; i++)
                {
                    layoutElement = layoutTarget.elements.source[i];
*//*                    if (!layoutElement || !layoutElement.includeInLayout)
                        continue;*//*

                    var layoutElementHeight;
                    if (!isNaN(layoutElement.percentHeight))
                        layoutElementHeight = calculatePercentHeight(layoutElement, targetHeight);
                    else
                        layoutElementHeight = layoutElement.getPreferredBoundsHeight();

                    containerHeight = Math.max(containerHeight, Math.ceil(layoutElementHeight));
                }
            }

            var excessWidth = distributeWidth(targetWidth, targetHeight, containerHeight);

            // default to top (0)
            var vAlign = 0;
            if (verticalAlign == $r.VerticalAlign.MIDDLE)
                vAlign = .5;
            else if (verticalAlign == $r.VerticalAlign.BOTTOM)
                vAlign = 1;

            var actualBaseline = 0;
            var alignToBaseline = verticalAlign == $r.VerticalAlign.BASELINE;
            if (alignToBaseline)
            {
                var result = calculateBaselineTopBottom(false *//*calculateBottom*//*);
                actualBaseline = result[0];
            }

            // If columnCount wasn't set, then as the LayoutElements are positioned
            // we'll count how many columns fall within the layoutTarget's scrollRect
            var visibleColumns = 0;
            var minVisibleX = layoutTarget.horizontalScrollPosition;
            var maxVisibleX = minVisibleX + targetWidth

            // Finally, position the LayoutElements and find the first/last
            // visible indices, the content size, and the number of
            // visible elements.
            var x = paddingLeft;
            var y0 = paddingTop;
            var maxX = paddingLeft;
            var maxY = paddingTop;
            var firstColInView = -1;
            var lastColInView = -1;

            // Take horizontalAlign into account
            if (excessWidth > 0)
            {
                var hAlign = horizontalAlign;
                if (hAlign == $r.HorizontalAlign.CENTER)
                {
                    x = paddingLeft + Math.round(excessWidth / 2);
                }
                else if (hAlign == $r.HorizontalAlign.RIGHT)
                {
                    x = paddingLeft + excessWidth;
                }
            }

            for (var index = 0; index < count; index++)
            {
                layoutElement = layoutTarget.elements.source[index];
*//*                if (!layoutElement || !layoutElement.includeInLayout)
                    continue;*//*

                // Set the layout element's position
                var dx = Math.ceil(layoutElement.getLayoutBoundsWidth());
                var dy = Math.ceil(layoutElement.getLayoutBoundsHeight());

                var y;
                if (alignToBaseline)
                {
                    var elementBaseline = layoutElement.baseline;
                    if (isNaN(elementBaseline))
                        elementBaseline = 0;

                    // Note: don't round the position. Rounding will case the text line to shift by
                    // a pixel and won't look aligned with the other element's text.
                    var baselinePosition = layoutElement.baselinePosition;
                    y = y0 + actualBaseline + elementBaseline - baselinePosition;
                }
                else
                {
                    y = y0 + (containerHeight - dy) * vAlign;
                    // In case we have VerticalAlign.MIDDLE we have to round
                    if (vAlign == 0.5)
                        y = Math.round(y);
                }

                layoutElement.setLayoutBoundsPosition(x, y);

                // Update maxX,Y, first,lastVisibleIndex, and x
                maxX = Math.max(maxX, x + dx);
                maxY = Math.max(maxY, y + dy);
                if (!clipAndEnableScrolling ||
                        ((x < maxVisibleX) && ((x + dx) > minVisibleX)) ||
                        ((dx <= 0) && ((x == maxVisibleX) || (x == minVisibleX))))
                {
                    visibleColumns += 1;
                    if (firstColInView == -1)
                        firstColInView = lastColInView = index;
                    else
                        lastColInView = index;
                }
                x += dx + gap;
            }

            setColumnCount(visibleColumns);
            setIndexInView(firstColInView, lastColInView);

            // Make sure that if the content spans partially over a pixel to the right/bottom,
            // the content size includes the whole pixel.
            layoutTarget.setContentSize(Math.ceil(maxX + paddingRight),
                    Math.ceil(maxY + paddingBottom));*/
        }

    };

})

$r.LayoutUtil = {

    pinBetween: function(val, min, max){

        return Math.min(max, Math.max(min, val));
    }



}

$r.Class("TileLayout").extends("LayoutBase")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})

$r.VerticalAlign = {

    TOP:"top",
    MIDDLE:"middle",
    BOTTOM:"bottom",
    JUSTIFY:"justify",
    CONTENT_JUSTIFY:"contentJustify",
    BASELINE:"baseline"

}


$r.Class("VerticalLayout").extends("LayoutBase")(function () {


    this.updateLayout = function () {

          console.log("I am VerticalLayout")
    };
})


   window.onload = function() {

         initApplications();
    }

    //now freezing the $r package
   //Object.freeze($r);


})(window, document);