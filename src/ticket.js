const debug = require('debug')('slash-command-template:ticket');
const api = require('./api');
const payloads = require('./payloads');
const config = require('./dbConfig');
const pool = require('./pool');

/*
 *  Send project creation confirmation via
 *  chat.postMessage to the user who created it
 */
const sendConfirmation = async (ticket) => {
  // open a DM channel for that user
  let channel = await api.callAPIMethod('conversations.open', {
    users: ticket.userId
  })

  let message = payloads.confirmation({
    channel_id: channel.channel.id,
    bu: ticket.bu,
    name: ticket.name,
    type: ticket.type
  });

  let result = await api.callAPIMethod('chat.postMessage', message)
  debug('sendConfirmation: %o', result);
};

// Create project. Call users.find to get the user's email address
// from their user ID
const create = async (userId, view) => {
  let values = view.state.values;

  // DEBUG
  console.log('VALUES OUTPUT');
  console.log(JSON.stringify(values));
  // call create record to insert record in pg database

  console.log(payload);
  const client = await pool.connect();
  let db_values = ['United States', 10, 'Copy;Creative', 'English;Spanish', 'P-101', 'https://salesforce.quip.com/BDAkAZ2LNBtK#temp:C:BAAf231b29341b44db9b4fe983c0','Campaign','New Members','2023-12-31', 80, 'US - SMB', 1000];
  try {
    await client.query('BEGIN');
    const queryText = 'INSERT INTO salesforce.Project__c (business_unit__c, communications__c, needs__c, languages__c, external_ref_id__c, brief__c, type__c, objective__c, due_date__c, goal__c, project_name__c, budget__c) ' +
                      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id';
    const res = await client.query(queryText, db_values);
    await client.query('COMMIT');
    console.log(res.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release(); 

    // DEBUG
    console.log(e);
  }



  console.log('RESPONSE OUTPUT', response);

  let result = await api.callAPIMethod('users.info', {
    user: userId
  });

  await sendConfirmation({
    userId,
    userEmail: result.user.profile.email,
    bu: values.bu_block.bu.selected_option && values.bu_block.bu.selected_option.text.text || 'not assigned',
    name: values.name_block.name.value || '_empty_',
    type: values.type_block.type.selected_option && values.type_block.type.selected_option.text.text || 'not assigned'
  });
};

module.exports = { create, sendConfirmation };
