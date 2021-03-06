import React from 'react';
import { connect } from 'react-redux';

import SellerProfileFlow from '../sellerProfileFlow';

import { withNavigatorProps } from '../../nav/RoutableScene';
import { setBuyerUid } from '../../reducers/ListingDetailReducer';

import SignInOrRegisterScene from '../SignInOrRegisterScene';
import ChatScene from '../ChatScene';
import ListingDetailScene from '../ListingDetailScene';

import ReceiptScene from './ReceiptScene';
import CreditCardInputScene from '../addCreditCardFlow/CreditCardInputScene';
import CompletedPurchaseScene from './CompletedPurchaseScene';
import AddEmailScene from '../addCreditCardFlow/AddCreditCardEmailScene';

import { registerWithEmail, signInWithEmail, getUser, createUser }
  from '../../firebase/FirebaseConnector';

import EditListingFlow from '../editListingFlow';


const chatFromDetailScene = {
  id: 'purchase_details_chat_s',
  renderContent: withNavigatorProps(<ChatScene leftIs="back" rightIs="actionSheet" />),
};

const chatFromReceiptScene = {
  id: 'purchase_receipt_chat_s',
  renderContent: withNavigatorProps(<ChatScene leftIs="back" rightIs="actionSheet" />),
};

const listingDetailScene = {
  id: 'details_s',
  renderContent: withNavigatorProps(<ListingDetailScene leftIs="back" rightIs="next" />),
};

const addEmailScene = {
  id: 'i_cc_email_scene',
  renderContent: withNavigatorProps(
    <AddEmailScene
      leftIs="back"
      rightIs="next"
      title="Add Credit Card (1/2)"
    />),
};

const receiptScene = {
  id: 'receipt_s',
  renderContent: withNavigatorProps(
    <ReceiptScene
      title="Confirm Purchase"
      leftIs="back"
      rightIs="return"
    />
  ),
};


const mapDispatchToProps = (dispatch) => {
  return {
    onSignedIn: (buyerUid) => dispatch(setBuyerUid(buyerUid)),
  };
};

const PurchaseFlowSignIn = connect(
  undefined,
  mapDispatchToProps
)(SignInOrRegisterScene);


const chatSignInScene = {
  id: 'signin_chat_s',
  renderContent: withNavigatorProps(
    <PurchaseFlowSignIn
      title="Sign in to chat."
      leftIs="back"
      rightIs="next"
      registerWithEmail={registerWithEmail}
      signInWithEmail={signInWithEmail}
      createUser={createUser}
    />),
};

const buySignInScene = {
  id: 'signin_buy_s',
  renderContent: withNavigatorProps(
    <PurchaseFlowSignIn
      title="Sign in to pay."
      leftIs="back"
      rightIs="next"
      registerWithEmail={registerWithEmail}
      signInWithEmail={signInWithEmail}
      createUser={createUser}
    />),
};

const creditCardInputScene = {
  id: 'i_cc_s',
  renderContent: withNavigatorProps(
    <CreditCardInputScene
      title="Add Credit Card (2/2)"
      leftIs="back"
    />),
};

const completedPurchaseScene = {
  id: 'completed_purchase_s',
  renderContent: withNavigatorProps(
    <CompletedPurchaseScene
      title="Purchase Complete"
      leftIs="back"
      rightIs="home"
    />
  ),
};


const routeLinks = {};

routeLinks[chatFromDetailScene.id] = {
  back: {
    getRoute: () => listingDetailScene,
  },
  actionSheet: {
    buttons: [],
    buttonsNextRouteName: {},
  },
};

routeLinks[addEmailScene.id] = {
  next: {
    title: 'OK',
    getRoute: () => creditCardInputScene,
  },
};

routeLinks[creditCardInputScene.id] = {
  return: {
    getRoute: () => receiptScene,
  },
};

routeLinks[receiptScene.id] = {
  back: {
    getRoute: () => listingDetailScene,
  },
  addPayment: {
    getRoute: () => addEmailScene,
  },
  chat: {
    getRoute: () => chatFromReceiptScene,
  },
  next: {
    title: '',
    getRoute: () => completedPurchaseScene,
  },
};

routeLinks[chatFromReceiptScene.id] = {
  actionSheet: {
    buttons: [],
    buttonsNextRouteName: {},
  },
};

routeLinks[listingDetailScene.id] = {
  edit: {
    title: 'Edit',
    getRoute: () => EditListingFlow.firstScene,
  },
  chat: {
    getRoute: () => {
      if (getUser()) {
        return chatFromDetailScene;
      }
      return chatSignInScene;
    },
  },
  buy: {
    getRoute: () => {
      if (getUser()) {
        return receiptScene;
      }
      return buySignInScene;
    },
  },
  sellerProfile: {
    getRoute: () => SellerProfileFlow.firstScene,
  },
};

routeLinks[chatSignInScene.id] = {
  next: {
    title: '',
    getRoute: () => chatFromDetailScene,
  },
};

routeLinks[buySignInScene.id] = {
  next: {
    title: '',
    getRoute: () => receiptScene,
  },
};

routeLinks[completedPurchaseScene.id] = {
  back: {
    getRoute: () => listingDetailScene,
  },
};

module.exports.routeLinks = routeLinks;
module.exports.firstScene = listingDetailScene;
