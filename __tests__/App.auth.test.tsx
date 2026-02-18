/// <reference types="jest" />

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../App';

const mockPromptGoogleSignIn = jest.fn();
const mockAppleSignIn = jest.fn();

let mockGoogleRequest: object | null = {};
let mockGoogleResponse: { type: string; authentication?: { accessToken?: string } } | null = null;

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'jjmgmt://redirect'),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [mockGoogleRequest, mockGoogleResponse, mockPromptGoogleSignIn]),
}));

jest.mock('expo-apple-authentication', () => {
  const ReactNative = require('react-native');
  const ReactLib = require('react');

  return {
    AppleAuthenticationScope: {
      FULL_NAME: 'FULL_NAME',
      EMAIL: 'EMAIL',
    },
    AppleAuthenticationButtonType: {
      SIGN_IN: 'SIGN_IN',
    },
    AppleAuthenticationButtonStyle: {
      BLACK: 'BLACK',
    },
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) =>
      ReactLib.createElement(ReactNative.Pressable, { onPress, testID: 'apple-sign-in-button' }),
    signInAsync: (...args: unknown[]) => mockAppleSignIn(...args),
  };
});

describe('App social auth', () => {
  beforeEach(() => {
    mockPromptGoogleSignIn.mockReset();
    mockAppleSignIn.mockReset();
    mockGoogleRequest = {};
    mockGoogleResponse = null;

    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';

    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('shows helper text when Google OAuth env vars are missing', () => {
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '';

    const { getByText } = render(<App />);

    expect(getByText('Set Google OAuth IDs in .env (see .env.example) to enable Google sign-in.')).toBeTruthy();
  });

  it('invokes Google prompt when user taps Continue with Google', () => {
    const { getByText } = render(<App />);

    fireEvent.press(getByText('Continue with Google'));

    expect(mockPromptGoogleSignIn).toHaveBeenCalledTimes(1);
  });

  it('renders signed-in profile after successful Google response and supports sign out', async () => {
    mockGoogleResponse = {
      type: 'success',
      authentication: { accessToken: 'token-123' },
    };

    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'Test User',
        email: 'test@example.com',
      }),
    });

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('Signed in with google')).toBeTruthy();
    });

    expect(getByText('Name: Test User')).toBeTruthy();
    expect(getByText('Email: test@example.com')).toBeTruthy();

    fireEvent.press(getByText('Sign out'));

    expect(getByText('Continue with Google')).toBeTruthy();
  });
});
