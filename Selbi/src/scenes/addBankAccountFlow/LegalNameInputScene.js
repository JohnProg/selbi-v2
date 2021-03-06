import { connect } from 'react-redux';

import InputScene from '../InputScene';
import { setLegalName } from '../../reducers/AddBankAccountReducer';

const mapStateToProps = (state) => {
  return {
    inputValue: state.addBank.legalName,
    inputTitle: 'What is the bank account owner\'s name?',
    placeholder: 'John Smith',
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    recordInput: (value) => {
      dispatch(setLegalName(value));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InputScene);
