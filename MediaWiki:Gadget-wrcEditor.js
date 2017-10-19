/**
 * Editing interface for the Wikimedia Resource Center.
 * 
 * This function subclasses the OOjs UI dialog class to create a dialog box with
 * an edit form. The contents of the edit form are populated by looking up the
 * unique ID of the entry via the data-wrc-unique-id attribute each WRC card has.
 * 
 * The unique ID is looked up in [[Module:Wikimedia Resource Center/Content]],
 * converted from Lua to JSON by the Luaparse gadget: [[MediaWiki:Gadget-luaparse.js]].
 * Upon saving the page, the Lua table is re-generated, with changed values
 * substituted as appropriate. The page is then re-loaded. If the delete button
 * is selected, the table is re-generated without that entry. New entries do not
 * have a unique ID assigned until the page is saved; this is how we know an
 * entry is new and does not already exist in the table.
 * 
 * See actual code here:
 * https://meta.wikimedia.org/wiki/MediaWiki:Gadget-wrcEditor-core.js
 */
( function () {
	'use strict';

	if ( mw.config.values.wgPageName.split('/')[0] == 'Wikimedia_Resource_Center' ) {
		mw.loader.load( 'ext.gadget.wrcEditor-core' );
	}
}() );
