import React from 'react';
import { Formik } from 'formik';
import { z } from 'zod';

import { snapshotWithoutClassNames as snapshot } from '../../test/snapshot-helpers';

import { FormikZod } from '../FormikZod';
import StyledInputFormikField from '../StyledInputFormikField';

describe('StyledInputFormikField', () => {
  it('renders default options', () => {
    snapshot(<Formik>{() => <StyledInputFormikField name="myAttribute" />}</Formik>);
  });

  describe('With Zod schema', () => {
    it('automatically adds attributes from Zod schema', () => {
      const schema = z.object({ myAttribute: z.string().min(10).max(100) });
      snapshot(<FormikZod schema={schema}>{() => <StyledInputFormikField name="myAttribute" />}</FormikZod>);
    });

    it('automatically adds attributes from Zod schema on nested field', () => {
      const schema = z.object({ my: z.object({ nested: z.object({ attribute: z.string().min(10).max(100) }) }) });
      snapshot(<FormikZod schema={schema}>{() => <StyledInputFormikField name="my.nested.attribute" />}</FormikZod>);
    });

    it('automatically adds attributes from Zod schema on optional field', () => {
      const schema = z.object({ myAttribute: z.string().optional() });
      snapshot(<FormikZod schema={schema}>{() => <StyledInputFormikField name="myAttribute" />}</FormikZod>);
    });

    it('automatically adds attributes from Zod schema on nullable field', () => {
      const schema = z.object({ myAttribute: z.string().nullable() });
      snapshot(<FormikZod schema={schema}>{() => <StyledInputFormikField name="myAttribute" />}</FormikZod>);
    });

    it('automatically adds attributes from Zod schema on number field', () => {
      const schema = z.object({ myAttribute: z.number().min(10).max(100) });
      snapshot(<FormikZod schema={schema}>{() => <StyledInputFormikField name="myAttribute" />}</FormikZod>);
    });
  });
});
