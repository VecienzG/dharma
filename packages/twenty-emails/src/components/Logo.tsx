import { Img } from '@react-email/components';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src="https://dharma.beautifullife.studio/dharma-logo.svg"
      alt="Dharma logo"
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
