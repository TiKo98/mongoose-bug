We used this repo to highlight a bug in mongoose https://github.com/Automattic/mongoose/issues/8804.

As my comments in the linked issue point out, we've found a great way to enable multilangual fields in mongoose. The IntlPlugin was heavily inspired by  <a href=https://www.npmjs.com/package/mongoose-intl>mongoose-intl</a>, but works completely different. It doesn't use virtuals, which works around the problem that mongoose has with calling setters on virtuals on update methods. Additionally it enables multilangual fields for all types, not only strings like mongoose-intl.

Our IntlPlugin is not intended to be a fully usable plugin for everyone (yet?). It only shows a way that works very well for us.
