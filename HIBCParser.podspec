Pod::Spec.new do |s|
  s.name         = "HIBCParser"
  s.version      = "0.1"
  s.summary      = "HIBC barcode data parser."
  s.homepage     = "http://github.com/jtlsystems/HIBCParser"
  s.license      = { :type => 'MIT', :file => 'LICENSE' }
  s.author       = { "Chris Jones" => "chrisjones12@me.com" }
  s.source       = { 
  	:git => "https://github.com/jtlsystems/HIBCParser.git", 
	:tag => "0.1" 
  }  
  s.platform     = :ios, '5.1'
  s.source_files = 'HIBCParser/**/*.{h,m}'
  s.requires_arc = true
end
