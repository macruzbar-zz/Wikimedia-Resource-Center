/**
 * Gadget to add new individual (ANI) to [[m:Connect/Individuals]] on the Wikimedia Resource Center (WRC).
 */
( function () {
	'use strict';
	
	if ( mw.config.values.wgPageName.split('/')[0] == 'Connect' ) {
		
		mw.loader.using( [
			'mediawiki.api',
			'oojs-ui',
			'oojs-ui-core',
			'oojs-ui.styles.icons-editing-core'
		] ).done( function () {
			var gadgetMsg, getContentIndividuals, openWindow,
				userLang, getContentModule, getRelevantRawEntry,
				addSkillsToUserpage, getUserpageData;
	
			userLang = mw.config.get( 'wgUserLanguage' );
			/**
			 * Query the I18n Template for keywords to be used in this gadget.
			 * NOTE: The strings must be marked for translation before the keys/value 
			 * pair works in the gadget.
			 */
			new mw.Api().get( {
				action: 'query',
				list: 'messagecollection',
				mcgroup: 'page-Template:I18n/Wikimedia_Resource_Center',
				mclanguage: userLang
			} ).done( function ( data ) {
				var i, res, key, val, gadgetMsg = {};
				res = data.query.messagecollection;
				for ( i = 0; i < res.length; i++ ) {
					key = res[ i ].key.replace( 'Template:I18n/Wikimedia_Resource_Center/', '' );
					val = res[ i ].translation;
					if ( !val ) {
						// No translation; fall back to English
						val = res[ i ].definition;
					}
					gadgetMsg[ key ] = val;
				}
				
				/**
				 * Provides API parameters for getting the content of the [[m:Connect/Individuals]] page
				 *
				 * @return {Object}
				 */
				getContentIndividuals = function () {
					return {
						action: 'query',
						prop: 'revisions',
						titles: 'Connect/Individuals',
						rvprop: 'content',
						rvlimit: 1
					};
				};
				
				/**
				 * Get userpage data of a specific user
				 * 
				 * @param {string} username Username of the user
				 * @return {Object} API response (wikitext)
				 */
				getUserpageData = function ( username ) {
					return {
						action: 'query',
						prop: 'revisions',
						titles: 'User:' + username,
						rvprop: 'content',
						rvlimit: 1
					};
				};
				
				/**
				 * Picks through the API response and returns a specific requested entry
				 *
				 * @param {Object} entries API response.
				 * @param {string} username the entry we want to pick out.
				 */
				getRelevantRawEntry = function ( entries, username ) {
					// Implement algorithm to get the required entry 
					// from the list of entries.
				};
				
				/**
				 * Gets the entire content of the [[m:Connect/Individuals]] page
				 *
				 * @param {Object} sourceblob The original API return
				 * @return {Object} raw Entire page content
				 */
				getContentModule = function ( sourceblob ) {
					var i, raw;
					for ( i in sourceblob ) {  // should only be one result
						raw = sourceblob[ i ].revisions[ 0 ][ '*' ];
						return raw;
					}
				};
				
				/**
				 * Add user's skills and/or experience to their user page
				 * 
				 * @param {string} username The username of the user
				 * @param {array} skills An array of the skills to be added to the user page
				 */
				addSkillsToUserpage = function ( username, skills ) {
					var i, userPageData, userPageDataWithCategories,
					categories = '', content;
					
					new mw.Api().get( getUserpageData( username ) ).done( function ( data ) {
						for ( i = 0; i < skills.length; i++ ) {
							categories += "\n[[Category:";
							categories += skills[ i ];
							categories += ']]';
						}
						content = getContentModule( data.query.pages );
						// Add new categories to the user's page content
						userPageDataWithCategories = content + categories;
						
						// Save the content plus the new categories on the user's page
						new mw.Api().postWithToken(
							'csrf',
							{
								action: 'edit',
								nocreate: true,
								summary: 'Added you to categories: ' + skills,
								title: 'User:' + username,  // User's userpage
								text: userPageDataWithCategories,
								contentmodel: 'wikitext'
							}
						).done( function () {
							dialog.close();
							// Purge the cache of the page from which the edit was made
							new mw.Api().postWithToken(
								'csrf',
								{ action: 'purge', titles: mw.config.values.wgPageName }
							).done( function () {
								location.reload();
							} );
						} ).fail( function () {
							alert( 'Could not add user to categories' );
							dialog.close();
						} );
					});
				};
	
				/**
				 * Subclass ProcessDialog
				 *
				 * @class WrcAddNewIndividual
				 * @extends OO.ui.ProcessDialog
				 *
				 * @constructor
				 * @param {Object} config
				 */
				function WrcAddNewIndividual( config ) {
					this.type = 'user';
					this.name = '';
					this.description = '';
					this.icon = '';
					this.skills = [];
	
					if ( config.name ) {
						this.name = config.name;
					}
					if ( config.description ) {
						this.description = config.description;
					}
					if ( config.icon ) {
						this.icon = config.icon;
					}
					if ( config.skills ) {
						this.skills = config.skills;
					}
					WrcAddNewIndividual.super.call( this, config );
				}
				OO.inheritClass( WrcAddNewIndividual, OO.ui.ProcessDialog );
	
				WrcAddNewIndividual.static.name = 'wrcAddNewIndividual';
				WrcAddNewIndividual.static.title = gadgetMsg[ 'editor-ani-button' ];
				WrcAddNewIndividual.static.actions = [
					{
						action: 'continue',
						modes: 'edit',
						label: gadgetMsg[ 'editor-save' ],
						flags: [ 'primary', 'constructive' ]
					},
					{
						action: 'cancel',
						modes: 'edit',
						label: gadgetMsg[ 'editor-cancel' ],
						flags: 'safe'
					}
				];
	
				/**
				 * Use the initialize() method to add content to the dialog's $body,
				 * to initialize widgets, and to set up event handlers.
				 */
				WrcAddNewIndividual.prototype.initialize = function () {
					var dialog, i, fieldSkillsToShare, fieldSkillsToShareSelected;
					dialog = this;
	
					WrcAddNewIndividual.super.prototype.initialize.call( this );
					this.content = new OO.ui.PanelLayout( {
						padded: true,
						expanded: false
					} );
					this.fieldType = new OO.ui.TextInputWidget( {
						value: this.type,
						indicator: 'required',
						required: true
					} );
					this.fieldName = new OO.ui.TextInputWidget( {
						value: this.name,
						indicator: 'required',
						required: true
					} );
					this.fieldDescription = new OO.ui.MultilineTextInputWidget( {
						value: this.description,
						rows: 5,
						indicator: 'required',
						required: true
					} );
					this.fieldIcon = new OO.ui.TextInputWidget( {
						value: this.icon
					} );
					fieldSkillsToShareSelected = [];
					for ( i = 0; i < this.skills.length; i++ ) {
						fieldSkillsToShareSelected.push(
							{ data: this.skills[ i ], label: gadgetMsg[ this.skills[ i ].toLowerCase().replace( / /g, '-' ) ] }
						);
					}
					this.fieldSkillsToShare = new OO.ui.MenuTagMultiselectWidget( {
						selected: fieldSkillsToShareSelected,
						options: [
							{ data: 'Program design skills',
								label: gadgetMsg[ 'program-design-skills' ] },
							{ data: 'Program evaluation skills',
								label: gadgetMsg[ 'program-evaluation-skills' ] },
							{ data: 'Program planning skills',
								label: gadgetMsg[ 'program-planning-skills' ] },
							{ data: 'Program management skills',
								label: gadgetMsg[ 'program-management-skills' ] },
							{ data: 'Storytelling skills',
								label: gadgetMsg[ 'storytelling-skills' ] },
							{ data: 'Press relations experience',
								label: gadgetMsg[ 'press-relations-experience' ] },
							{ data: 'Annual planning skills',
								label: gadgetMsg[ 'annual-planning-skills' ] },
							{ data: 'Survey skills',
								label: gadgetMsg[ 'survey-skills' ] },
							{ data: 'Fundraising skills',
								label: gadgetMsg[ 'fundraising-skills' ] },
							{ data: 'Financial skills',
								label: gadgetMsg[ 'financial-skills' ] },
							{ data: 'Affiliate collaboration skills',
								label: gadgetMsg[ 'affiliate-collaboration-skills' ] },
							{ data: 'Event organization and planning skills',
								label: gadgetMsg[ 'event-organization-and-planning-skills' ] },
							{ data: 'Event program design skills',
								label: gadgetMsg[ 'event-program-design-skills' ] },
							{ data: 'Facilitation skills',
								label: gadgetMsg[ 'facilitation-skills' ] },
							{ data: 'Online governance experience',
								label: gadgetMsg[ 'online-governance-experience' ] },
							{ data: 'New affiliate proposal experience',
								label: gadgetMsg[ 'new-affiliate-proposal-experience' ] }
						],
						indicator: 'required'
					} );
	
					// Append things to fieldSet
					this.fieldSet = new OO.ui.FieldsetLayout( {
						items: [
							new OO.ui.FieldLayout(
								this.fieldName,
								{
									label: gadgetMsg[ 'editor-ani-fieldname' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ani-fieldname-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldDescription,
								{
									label: gadgetMsg[ 'editor-ani-fielddescription' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ani-fielddescription-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldIcon,
								{
									label: gadgetMsg[ 'editor-ani-fieldicon' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ani-fieldicon-help' ]
								}
							),
							new OO.ui.FieldLayout(
							this.fieldSkillsToShare,
							{
								label: gadgetMsg[ 'editor-ani-skills-and-exprience' ],
								align: 'top',
								help: gadgetMsg[ 'editor-ani-skills-and-exprience-help' ]
							}
						),
						]
					} );
					
					// When everything is done
					this.content.$element.append( this.fieldSet.$element );
					this.$body.append( this.content.$element );
				};
	
				/**
				 * Set custom height for the modal window
				 */
				WrcAddNewIndividual.prototype.getBodyHeight = function () {
					return 400; // NOTE: Remember to add height when new fields are added.
				};
	
				/**
				 * In the event "Select" is pressed
				 */
				WrcAddNewIndividual.prototype.getActionProcess = function ( action ) {
					var dialog = this;
					if ( action === 'continue' && dialog.fieldType.getValue() ) {
						return new OO.ui.Process( function () {
							dialog.saveItem();
						} );
					} else {
						return new OO.ui.Process( function () {
							dialog.close();
						} );
					}
					return NewItemDialog.parent.prototype.getActionProcess.call( this, action );
				};
	
				/**
				 * Save the changes to the [[Connect/Individuals]] page.
				 */
				WrcAddNewIndividual.prototype.saveItem = function () {
					var dialog = this, content;
	
					dialog.pushPending();
	
					new mw.Api().get( getContentIndividuals() ).done( function ( data ) {
						var i, insertInPlace, generateIndividualData, processWorkingEntry,
							editSummary, manifest = [], workingEntry, username,
							skills;
	
						/**
						 * Creates individual data to resemble that in template.
						 */
						generateIndividualData = function ( k, v ) {
							var res;
							res = '| '.concat( k, ' = ' );
							res += v + '\n';
							return res;
						};
						
						/**
						 * Compares a given Wikimedia Resource Center entry against the
						 * edit fields and applies changes where relevant.
						 *
						 * @param {Object} workingEntry the entry being worked on
						 * @return {Object} The same entry but with modifications
						 */
						processWorkingEntry = function ( workingEntry ) {
							workingEntry.type = dialog.fieldType.getValue();
	
							if ( dialog.fieldType.getValue() ) {
								workingEntry.type = dialog.fieldType.getValue();
							} else if ( !dialog.fieldType.getValue() && workingEntry.type ) {
								delete workingEntry.type;
							}
							
							if ( dialog.fieldName.getValue() ) {
								workingEntry.name = dialog.fieldName.getValue();
							} else if ( !dialog.fieldName.getValue() && workingEntry.name ) {
								delete workingEntry.name;
							}
	
							if ( dialog.fieldDescription.getValue() ) {
								workingEntry.description = dialog.fieldDescription.getValue();
							} else if ( !dialog.fieldDescription.getValue() && workingEntry.description ) {
								delete workingEntry.description;
							}
	
							if ( dialog.fieldIcon.getValue() ) {
								workingEntry.icon = dialog.fieldIcon.getValue();
							} else if ( !dialog.fieldIcon.getValue() && workingEntry.icon ) {
								delete workingEntry.icon;
							}
							
							if ( dialog.fieldSkillsToShare.getValue() ) {
								workingEntry.skills = dialog.fieldSkillsToShare.getValue();
							} else if ( !dialog.fieldSkillsToShare.getValue() && workingEntry.skills ) {
								delete workingEntry.skills;
							}
	
							return workingEntry;
						};
						
						workingEntry = {};
						workingEntry = processWorkingEntry( workingEntry );
						editSummary = 'Adding new individual '.concat( workingEntry.name );
						manifest.push( workingEntry );

						// Re-generate the [[m:Connect/Individual]] table based on `manifest`
						insertInPlace = '\n{{Connect listing\n';
						for ( i = 0; i < manifest.length; i++ ) {
							if ( manifest[ i ].type ) {
								insertInPlace += generateIndividualData(
									'type',
									manifest[ i ].type
								);
							}
							if ( manifest[ i ].name ) {
								insertInPlace += generateIndividualData(
									'name',
									manifest[ i ].name
								);
								// Keep track of the username
								username = manifest[ i ].name;
							}
							if ( manifest[ i ].description ) {
								insertInPlace += generateIndividualData(
									'description',
									manifest[ i ].description
								);
							}
							if ( manifest[ i ].icon ) {
								insertInPlace += generateIndividualData(
									'icon',
									manifest[ i ].icon
								);
							}
							if ( manifest[ i ].skills ) {
								skills = manifest[ i ].skills;
							}
						}
						insertInPlace += '}}\n';
						
						content = getContentModule( data.query.pages );
						// Append new individual to entire page content
						insertInPlace = content + insertInPlace;

						// Now update the Individuals page.
						new mw.Api().postWithToken(
							'csrf',
							{
								action: 'edit',
								nocreate: true,
								summary: editSummary,
								pageid: 10454752,  // Connect/Individuals
								text: insertInPlace,
								contentmodel: 'wikitext'
							}
						).done( function () {
							dialog.close();
							// Purge the cache of the page from which the edit was made
							new mw.Api().postWithToken(
								'csrf',
								{ action: 'purge', titles: mw.config.values.wgPageName }
							).done( function () {
								location.reload();
							} );
						} ).fail( function () {
							alert( gadgetMsg[ 'editor-ani-failed-alert' ] );
							dialog.close();
						} );
						
						// Add user's skills they can share to their user page
						addSkillsToUserpage( username, skills );
					} );
				};
				
				/**
				 * Event handler for when someone clicks on an edit icon/button
				 *
				 * @param {Object} config
				 */
				openWindow = function ( config ) {
					var wrcAddNewIndividual, windowManager;
					config.size = 'large';
					wrcAddNewIndividual = new WrcAddNewIndividual( config );
	
					windowManager = new OO.ui.WindowManager();
					$( 'body' ).append( windowManager.$element );
					windowManager.addWindows( [ wrcAddNewIndividual ] );
					windowManager.openWindow( wrcAddNewIndividual );
				};
				
				// Edit user content via the form
				$( '.user-edit-icon' ).each( function () {
					var $icon = $( this ),
						editButton;
					editButton = new OO.ui.ButtonWidget( {
						framed: false,
						icon: 'edit'
					} ).on( 'click', function () {
						new mw.Api().get( getContentIndividuals() ).done( function ( data ) {
							var entryData, username, content;
							
							username = editButton.$element
							.closest( '.wrc-card' )
							.data( 'wrc-unique-id' );
							
							content = getContentModule( data.query.pages );
							//entryData = getRelevantRawEntry( content, username );
							
							openWindow( entryData );
						} );
					} );
					$icon.css( 'float', 'right' );
					$icon.append( editButton.$element );
				} );
				
				// Open dialog when "Add new individual" is clicked
				$( '.wrc-ai-button' ).each( function () {
					var $addButton = $( this ),
						addButton;
					addButton = new OO.ui.ButtonWidget( {
						icon: 'add',
						label: gadgetMsg[ 'editor-ani-button' ],
						flags: [ 'primary', 'progressive' ]
					} ).on( 'click', function () {
						openWindow( {} );
					} );
					$addButton.css( 'margin', '1.125em' );
					$addButton.append( addButton.$element );
				} );
			} );
		} );
	}
}() );