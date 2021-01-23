/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as playwright from 'playwright';
import { ActionInContext } from '../codeGenerator';

export type HighlighterType = 'javascript' | 'csharp' | 'python';

export interface LanguageGenerator {
  generateHeader(browserName: string, launchOptions: playwright.LaunchOptions, contextOptions: playwright.BrowserContextOptions, deviceName?: string): string;
  generateAction(actionInContext: ActionInContext, performingAction: boolean): string;
  generateFooter(saveStorage: string | undefined): string;
  highligherType(): HighlighterType;
}

export { JavaScriptLanguageGenerator } from './javascript';