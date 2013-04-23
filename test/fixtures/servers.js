/*
 * servers.js: Seed data for Server resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
module.exports = [{
  resource: 'Server',
  name: 'composer0',
  group: 'composer',
  role: 'composer',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
},
{
  resource: 'Server',
  name: 'composer1',
  group: 'composer',
  role: 'composer',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
},
{
  resource: 'Server',
  name: 'conservatory0',
  group: 'group-0',
  role: 'conservatory',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
},
{
  resource: 'Server',
  name: 'conservatory1',
  group: 'group-1',
  role: 'conservatory',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
},
{
  resource: 'Server',
  name: 'quill0',
  group: 'group-0',
  role: 'quill-base',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
},
{
  resource: 'Server',
  name: 'quill1',
  group: 'group-1',
  role: 'quill-base',
  status: 'RUNNING',
  addresses: {
    public: ['127.0.0.1'],
    private: ['127.0.0.1']
  }
}];
