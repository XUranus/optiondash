import { Layout as AntLayout, Typography } from 'antd';

const { Header, Content, Footer } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Header className="flex items-center px-6 bg-white shadow-sm border-b border-gray-200 h-16">
        <Title level={4} className="!mb-0 !text-gray-800">
          OptionDash
        </Title>
        <span className="ml-3 text-xs text-gray-400 hidden sm:inline">
          Options Chain Analysis & Market Sentiment
        </span>
      </Header>
      <Content className="p-4 md:p-6">{children}</Content>
      <Footer className="text-center text-gray-400 text-sm py-4">
        OptionDash &copy; {new Date().getFullYear()} — Data provided by Yahoo
        Finance (delayed ~15 min)
      </Footer>
    </AntLayout>
  );
};

export default Layout;
