const mongoose = require('mongoose');
const _ = require('lodash');

module.exports = function mongooseObjectIntl(schema, options) {
  if (
    !options ||
    !options.languages ||
    !Array.isArray(options.languages) ||
    !options.languages.length
  ) {
    throw new mongoose.Error("Required languages array is missing");
  }

  // plugin options to be set under schema options
  schema.options.mongooseIntl = {};
  var pluginOptions = schema.options.mongooseIntl;

  pluginOptions.languages = options.languages.slice(0);

  // the first available language will be used as default if it's not set or unknown value passed
  function setDefaultLanguage() {
    if (
      !options.returnLanguage ||
      pluginOptions.languages.indexOf(options.returnLanguage) === -1
    ) {
      pluginOptions.returnLanguage = pluginOptions.languages[0];
    } else {
      pluginOptions.returnLanguage = options.returnLanguage.slice(0);
    }
  }
  setDefaultLanguage();
  

  schema.static({
    getLanguages: function () {
      return this.schema.options.mongooseIntl.languages;
    },
    getReturnLanguage: function () {
      return this.schema.options.mongooseIntl.returnLanguage;
    },
    setReturnLanguage: function (newLanguage) {
      this.schema.options.mongooseIntl.returnLanguage = newLanguage;
    }
  });

  const intlFields = []
  schema.eachPath(function (path, schemaType) {
    if (schemaType.schema) {
      // propagate plugin initialization for sub-documents schemas
      schemaType.schema.plugin(mongooseObjectIntl, pluginOptions);
      return;
    }

    if (!schemaType.options.intl) {
      return;
    }

    intlFields.push({ path, options: schemaType.options });

    // getter
    schema.path(path).get(function (doc) {
      const lang = pluginOptions.returnLanguage;
      if (!doc) return undefined;
      
      if (lang && doc[lang]) {
        return doc[lang];
      }

      if (lang === null) {
        return doc;
      }

      if (doc[pluginOptions.languages[0]]) {
        return doc[pluginOptions.languages[0]] // return first language -> most likely english
      }

      if (!isIntlObject(doc)) {
        return doc; // if doc had value before internationalisation which wasn't converted to intlObject yet
      }

      return undefined; // Better return nothing than an intlObject with other languages than the requested one or the first language!
    });

  });

  schema.pre(["findOneAndUpdate", "updateOne"], async function() { 
    const existingDoc = await this.model.findOne(
      this._conditions,
      intlFields.map(f => f.path).join(" ")
    );
    await Promise.all(
      intlFields.map(async ({path, options}) => {
        
        let pathUpdate = _.get(this._update, path.split(".")); // this._update[path] doesn't work for nested objects :(
        if (!pathUpdate) return; 

        // make update an intlObject if isn't one yet
        if (!isIntlObject(pathUpdate)) {
          const lang = pluginOptions.returnLanguage;
          if (options.translate) {
            pathUpdate = await options.translate(pathUpdate);
          } else {
            pathUpdate = { [lang]: pathUpdate}
          }          
        }        

        // getting the value of existingDoc[path] would only return the value for the current return language
        const languageBefore = pluginOptions.returnLanguage;
        pluginOptions.returnLanguage = null;

        // merge existing languages with new one
        const intlBefore = existingDoc && existingDoc[path]? existingDoc[path] : {}
        const newIntl = {...intlBefore, ...pathUpdate}

        _.set(this._update, path.split("."), newIntl);
        pluginOptions.returnLanguage = languageBefore;        
      })
    );
  })

  // ----------helpers-----------------
  function isIntlObject(obj) {
    try {
      return pluginOptions.languages.includes(Object.keys(obj)[0]);
    } catch(e) {
      return false;
    }    
  }
};


