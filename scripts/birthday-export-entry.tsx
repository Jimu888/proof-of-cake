import React from 'react';
import {createRoot} from 'react-dom/client';
import BirthdayReceive from '../src/components/birthday-receive';
import '../src/app/globals.css';
createRoot(document.getElementById('root')!).render(<BirthdayReceive assetBase="./assets/model/" shellBase="./assets/shell/"/>);
