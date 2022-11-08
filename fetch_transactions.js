const axios = require('axios');

const URL = 'http://localhost:8080/blocks/';
const BLOCK = '2939835'; //2919583, 2938413, 2939835

const main = async () => {
  // HTTP Request
  const response = await axios.get(URL + BLOCK);

  // Go Through Each Extrinisc
  response.data.extrinsics.map((extrinsic) => {
    // Substrate Pallet Balances Transfer
    if (extrinsic.method.pallet.toLowerCase() === 'balances' && extrinsic.method.method.toLowerCase() === 'transfer') {
      let amount = BigInt(0);
      let fee = BigInt(0);
      // Go Through Each Event
      extrinsic.events.map((event) => {
        // Get Balance Transfer Event
        if (event.method.pallet.toLowerCase() === 'balances' && event.method.method.toLowerCase() === 'transfer') {
          console.log('SUBSTRATE TRANSACTION -----');
          amount = BigInt(event.data[2]);
          console.log(`From: ${event.data[0]}\nTo: ${event.data[1]}\nAmount: ${amount.toLocaleString()}`);
        }
        // Get Fee Payment Event
        if (
          event.method.pallet.toLowerCase() === 'transactionpayment' &&
          event.method.method.toLowerCase() === 'transactionfeepaid'
        ) {
          fee = BigInt(event.data[1]);
          console.log(`Fee: ${fee.toLocaleString()}`);
        }
      });
    }

    // Ethereum Balance Transfer (only if MSG.VALUE != 0!)
    if (extrinsic.method.pallet.toLowerCase() === 'ethereum' && extrinsic.method.method.toLowerCase() === 'transact') {
      let amount = BigInt(0);
      let weight = BigInt(0);
      let gasPrice = BigInt(0);
      let value = BigInt(0);
      let baseFee = BigInt(1000000000); // BaseFee 1 Gwei Moonriver
      let fee = BigInt(0);
      let feeCheck = 0;

      // Get Tx Type, Gas Price and Value

      switch (Object.keys(extrinsic.args.transaction)[0]) {
        case 'legacy':
          value = BigInt(extrinsic.args.transaction.legacy.value);
          gasPrice = baseFee;
          break;
        case 'eip2839':
          value = BigInt(extrinsic.args.transaction.eip2839.value);
          gasPrice = baseFee;
          break;
        case 'eip1559':
          value = BigInt(extrinsic.args.transaction.eip1559.value);
          gasPrice = BigInt(extrinsic.args.transaction.eip1559.maxPriorityFeePerGas);
          // (max_fee_per_gas - base_fee).min(max_priority_fee)
          break;
        default:
          console.error('Tx type not supported!');
      }

      // Go Through Each Event
      if (value != BigInt(0)) {
        console.log('ETHEREUM TRANSACTION -----');
        extrinsic.events.map((event, index) => {
          // Get Balance Transfer Event
          if (event.method.pallet.toLowerCase() === 'balances' && event.method.method.toLowerCase() === 'transfer') {
            console.log(`Transfer ${index}`);
            amount = BigInt(event.data[2]);
            console.log(`From: ${event.data[0]}\nTo: ${event.data[1]}\nAmount: ${amount.toLocaleString()}`);
            feeCheck = 1;
          }
          // Get Weight and Gas Info
          if (
            event.method.pallet.toLowerCase() === 'system' &&
            event.method.method.toLowerCase() === 'extrinsicsuccess' &&
            feeCheck
          ) {
            // Weight
            weight = BigInt(event.data[0].weight);

            // Calculate Tx Fee

            fee = (gasPrice * weight) / BigInt(25000); // 25000 is a Weight to Gas Factor
            console.log(`Fee: ${fee.toLocaleString()}`);
          }
        });
      }
    }
  });
};

main();
